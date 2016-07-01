'use strict';

var _ = require('underscore');
var querydb = require('./querydb');

function mapModulesToSequences(credits) {
   return new Promise((resolve, reject) => {
      var ids = credits.map((credit) => credit.link.match(/sm\-([0-9]+)\./)[1]);
      querydb.getSequencesForIds(ids)
      .then((results) => {
         var mapped = _.map(credits, (credit) => {
            var sm = credit.link.match(/sm\-([0-9]+)\./)[1];
            credit.paths = _.chain(results).filter((result) => result.module == sm).map((result) => result.category.split(',')).value()
            return credit;
         });
         resolve(mapped);
      })
   });
}

function getTreeModules(tree) {
   var modules = [];
   let add = (subtree) => {
      modules = modules.concat(subtree.elements);
      modules = modules.concat(getTreeModules(subtree.children))
   }
   if (tree.elements) {
      add(tree)
   }
   else {
      _.each(tree, add);
   }

   return _.uniq(modules);
}


function eliminateEncompassedModules(tree, prefix, redundancies) {
   var redundancies = redundancies || {};
   var keys = _.keys(tree);
   for (var i = 0; i < keys.length; i++) {
      var tree1 = tree[keys[i]];
      for (var j = 0; j < keys.length; j++) {
         var tree2 = tree[keys[j]];
         if (i != j && tree1 && tree2 && encompassesTree(tree1, tree2)) {
            var mapped = treeToMap(tree[keys[j]].children)
            _.each(mapped, (links, key) => {
               _.each(links, (link) => {
                  if (!redundancies[link]) {
                     redundancies[link] = [];
                  }
                  redundancies[link].push(`${prefix}${keys[j]},${key}`.split(','));
               })
            });
            delete tree[keys[j]];
         }
      }
   }
   return redundancies;
}


function reduceTreeRedundancy(tree, redundancies, prefix) {
   redundancies = redundancies || {};
   prefix = prefix || '';
   var subtree_count = _.keys(tree).length;
   if (subtree_count > 1) {
      redundancies = eliminateEncompassedModules(tree, prefix, redundancies);
   }
   _.each(tree, (subtree, key) => {
      redundancies = reduceTreeRedundancy(subtree.children, redundancies, `${prefix}${key},`);
   });
   return redundancies;
}

function encompassesTree(tree1, tree2) {
   var modules1 = getTreeModules(tree1);
   var modules2 = getTreeModules(tree2);
   return _.difference(modules2, modules1).length == 0 && modules1.length > modules2.length;
}

function treeToMap(tree, map, prefix) {
   map = map || {};
   prefix = prefix || '';
   var keys = _.keys(tree);
   for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var elements = tree[key].elements;
      _.each(elements, (element) => {
         if (!map[`${prefix}${key}`]) {
            map[`${prefix}${key}`] = [];
         }
         map[`${prefix}${key}`].push(element)
      });
      var children = tree[key].children;
      treeToMap(children, map, `${prefix}${key},`);
   }
   return map;
}

function removeRedundancies(modules, redundancies) {
   return modules.map((module) => {
      if (redundancies[module.link]) {
         for (var i = 0; i < module.paths.length; i++) {
            for (var j = 0; j < redundancies[module.link].length; j++) {
               if (_.isEqual(redundancies[module.link][j].slice(1), module.paths[i])) {
                  delete module.paths[i];
               }
            }
         }
         module.paths = _.compact(module.paths);
      }
      return module;
   });
}

exports.addPaths = (credits, studydirections) => {
   return new Promise((resolve, reject) => {
      mapModulesToSequences(credits)
      .then((modules) => {
         var studydirectionmap = _.map(_.pluck(studydirections, 'code'), (direction) => {
            // Find modules that belong to that study direction
            var includedmodules = _.filter(modules, (module) => {
               return _.any(module.paths, (_map) => _.contains(_map, direction));
            });
            // Remove paths not belonging to study direction
            includedmodules = _.map(includedmodules, (module) => {
               module.paths = _.filter(module.paths, (_map) => {
                  return _.contains(_map, direction)
               });
               return module;
            });
            return {
               direction,
               modules: includedmodules
            }
         });

         var tree = {};

         _.map(studydirectionmap, (direction) => {
            tree[direction.direction] = {
               children: {},
               elements: []
            };
            for (var i = 0; i < direction.modules.length; i++) {
               var module = direction.modules[i];
               for (var j = 0; j < module.paths.length; j++) {
                  var map = module.paths[j];
                  var tree_element = tree[direction.direction];
                  for (var k = 0; k < map.length; k++) {
                     var map_element = map[k];
                     if (!tree_element.children[map_element]) {
                        tree_element.children[map_element] = {
                           children: {},
                           elements: []
                        }
                     }
                     tree_element = tree_element.children[map_element];
                  }
                  tree_element.elements.push(module.link)
               }
            }
         });

         var redundancies = reduceTreeRedundancy(tree);
         var redundancyFreeModules = removeRedundancies(modules, redundancies);
         resolve(redundancyFreeModules);
      })
      .catch((err) => {
         reject(err);
      })
   });
}

exports.getCategories = (credits) => {
   var ids = _.chain(credits).pluck('paths').flatten().value();
   return querydb.getCategoriesForIds(ids)
}