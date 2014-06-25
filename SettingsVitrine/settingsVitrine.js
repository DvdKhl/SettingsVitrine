///<reference path="ThirdParty/DefinitelyTyped/angularjs/angular.d.ts" />
var SettingsVitrine;
(function (SettingsVitrine) {
    var Helper = (function () {
        function Helper() {
        }
        Helper.traverseSchemaSections = function (section, separator, sectionsCallback, entriesCallback) {
            if (sectionsCallback)
                sectionsCallback(section.name, 0, section);

            if (entriesCallback && section.entries) {
                for (var i = 0; i < section.entries.length; i++) {
                    var entry = section.entries[i];
                    entriesCallback(entry.name, 1, entry);
                }
            }

            if (section.sections)
                Helper.traverseSchemaSectionsSub(section.sections, separator, "", 1, sectionsCallback, entriesCallback);
        };

        Helper.traverseSchemaSectionsSub = function (sections, separator, path, depth, sectionsCallback, entriesCallback) {
            for (var i = 0; i < sections.length; i++) {
                var section = sections[i];
                var entryPath = path + section.name;

                if (sectionsCallback)
                    sectionsCallback(entryPath, depth, section);

                if (entriesCallback && section.entries) {
                    for (var j = 0; j < section.entries.length; j++) {
                        var entry = section.entries[j];
                        entriesCallback(entryPath + separator + entry.name, depth + 1, entry);
                    }
                }

                if (section.sections)
                    Helper.traverseSchemaSectionsSub(section.sections, separator, entryPath + separator, depth + 1, sectionsCallback, entriesCallback);
            }
        };
        return Helper;
    })();

    SettingsVitrine.Unset = {};
    SettingsVitrine.DisplayTemplateUrl = 'SettingsVitrine/Templates/display.html';

    var SettingsProxy = (function () {
        function SettingsProxy(service, pathPrefix) {
            this.service = service;
            this.pathPrefix = pathPrefix + ".";
        }
        SettingsProxy.prototype.set = function (key, value) {
            return this.service.Set(this.pathPrefix + key, value);
        };
        SettingsProxy.prototype.get = function (key) {
            return this.service.Get(this.pathPrefix + key);
        };
        return SettingsProxy;
    })();
    SettingsVitrine.SettingsProxy = SettingsProxy;

    var LocalStorageProvider = (function () {
        function LocalStorageProvider() {
        }
        LocalStorageProvider.prototype.GetInfo = function (name) {
            throw Error("LocalStorageProvider.getInfo: Not Implemented");
        };
        LocalStorageProvider.prototype.GetData = function (name) {
            return JSON.parse(localStorage.getItem(name));
        };
        LocalStorageProvider.prototype.SetData = function (name, data) {
            localStorage.setItem(name, JSON.stringify(data));
        };
        return LocalStorageProvider;
    })();

    var SettingsStorage = (function () {
        function SettingsStorage(name, schema, parent, settings) {
            if (typeof parent === "undefined") { parent = null; }
            if (typeof settings === "undefined") { settings = null; }
            var _this = this;
            this.name = name;
            this.schema = schema;

            this.schemaEntries = [];
            var entriesCallback = function (path, depth, entry) {
                _this.schemaEntries[path] = {
                    path: path,
                    depth: depth,
                    base: entry
                };
            };
            Helper.traverseSchemaSections(schema, ".", null, entriesCallback);

            this.settings = settings || {};
            this.parent = parent;
        }
        Object.defineProperty(SettingsStorage.prototype, "Schema", {
            get: function () {
                return this.schema;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SettingsStorage.prototype, "Parent", {
            get: function () {
                return this.parent;
            },
            enumerable: true,
            configurable: true
        });

        SettingsStorage.prototype.Set = function (key, value) {
            if (value === undefined)
                return false;

            if (value === SettingsVitrine.Unset) {
                delete this.settings[key];
            } else if (key in this.schemaEntries) {
                this.settings[key] = value;
            } else {
                return false;
            }
            return true;
        };
        SettingsStorage.prototype.SetMultiple = function (settings) {
            for (var setting in settings)
                this.Set(setting, settings[setting]);
        };

        SettingsStorage.prototype.Get = function (key) {
            var value = undefined;
            if (key in this.settings) {
                value = this.settings[key];
            } else if (this.parent) {
                value = this.parent.Get(key);
            } else if (key in this.schemaEntries) {
                var entry = this.schemaEntries[key].base;
                value = entry.defaultValue || null;
            } else {
                console.log("SettingsStorage.Get: Key " + key + " not in schema");
            }

            return value;
        };
        SettingsStorage.prototype.GetWithoutSelf = function (key) {
            var value = undefined;
            if (this.parent) {
                value = this.parent.Get(key);
            } else if (key in this.schemaEntries) {
                var entry = this.schemaEntries[key].base;
                value = entry.defaultValue || null;
            }
            return value;
        };
        SettingsStorage.prototype.GetSchemaDefault = function (key) {
            var value = undefined;
            if (key in this.schemaEntries) {
                var entry = this.schemaEntries[key].base;
                value = entry.defaultValue || null;
            } else {
                console.log("SettingsStorage.GetSchemaDefault: Key " + key + " not in schema");
            }
            return value;
        };
        SettingsStorage.prototype.GetImmediate = function (key) {
            return this.settings[key];
        };
        SettingsStorage.prototype.GetNoSchemaDefault = function (key) {
            var value = undefined;
            if (key in this.settings) {
                value = this.settings[key];
            } else if (this.parent) {
                value = this.parent.GetNoSchemaDefault(key);
            }
            return value;
        };

        SettingsStorage.prototype.ClearAll = function () {
            this.settings = {};
        };
        SettingsStorage.prototype.CreateProxy = function (keyPrefix) {
            return new SettingsProxy(this, keyPrefix);
        };

        SettingsStorage.prototype.CreateDeriving = function (name) {
            return new SettingsStorage(name, this.schema, this);
        };

        SettingsStorage.prototype.SaveToLocalStorage = function () {
            this.SaveTo(SettingsStorage.LocalStorageProvider);
        };
        SettingsStorage.prototype.SaveTo = function (provider) {
            var curStorage = this;

            while (curStorage) {
                var parentName = curStorage.parent ? curStorage.parent.name : null;
                provider.SetData(this.schema.name + "." + curStorage.name, { parentName: parentName, settings: curStorage.settings });
                curStorage = curStorage.parent || null;
            }
        };

        SettingsStorage.LoadFromLocalStorage = function (name, schema) {
            return this.LoadFrom(name, schema, SettingsStorage.LocalStorageProvider);
        };
        SettingsStorage.LoadFrom = function (name, schema, provider) {
            var storage = new SettingsStorage(name, schema);

            var curStorage = storage;
            var fullName = schema.name + "." + name;
            while (fullName) {
                var data = provider.GetData(fullName);
                if (!data) {
                    console.log("SettingsStorage.LoadFrom: Settings with name " + fullName + " not found.");
                    return null;
                }

                curStorage.settings = data.settings;

                if (data.parentName) {
                    curStorage.parent = new SettingsStorage(data.parentName, schema);
                    curStorage = curStorage.parent;

                    fullName = data.parentName ? schema.name + "." + data.parentName : null;
                } else
                    fullName = null;
            }

            return storage;
        };

        Object.defineProperty(SettingsStorage.prototype, "Keys", {
            get: function () {
                return this.settings.keys();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SettingsStorage.prototype, "Settings", {
            get: function () {
                return this.settings;
            },
            set: function (settings) {
                this.settings = settings;
            },
            enumerable: true,
            configurable: true
        });
        SettingsStorage.LocalStorageProvider = new LocalStorageProvider();
        return SettingsStorage;
    })();
    SettingsVitrine.SettingsStorage = SettingsStorage;

    var DisplayController = (function () {
        function DisplayController($scope, storage) {
            var _this = this;
            this.vm = {
                settings: {},
                sections: [],
                selectedSection: null,
                selectedTreeNode: null,
                descriptionUrl: "",
                setSelection: function (section) {
                    return _this.setSelection(section);
                },
                hasSettingChanged: function (key) {
                    return _this.hasSettingChanged(key);
                },
                isDefaultSetting: function (key) {
                    return _this.isDefaultSetting(key);
                },
                reload: function (key) {
                    return _this.reload(key);
                },
                toggleDefault: function (key) {
                    return _this.toggleDefault(key);
                },
                resetDescription: function () {
                    return _this.resetDescription();
                },
                getDefault: function (key) {
                    return _this.storage.GetSchemaDefault(key);
                },
                reloadAll: function () {
                    return _this.reloadAll();
                },
                unsetAll: function () {
                    return _this.unsetAll();
                },
                save: function () {
                    return _this.save();
                },
                replaceAll: function (str, pattern, replace) {
                    return str.replace(new RegExp(pattern, "g"), replace);
                }
            };
            this.$scope = $scope;
            $scope.vm = this.vm;

            this.storage = storage;
            this.vm.settings = angular.extend({}, storage.Settings);

            this.vm.sections = this.flattenTree(storage.Schema);
            this.setSelection(this.vm.sections[0]);

            this.resetDescription();
        }
        DisplayController.prototype.resetDescription = function () {
            this.vm.descriptionUrl = "templates/sv/intro.html";
        };
        DisplayController.prototype.reloadAll = function () {
            this.vm.settings = angular.extend({}, this.storage.Settings);
        };
        DisplayController.prototype.unsetAll = function () {
            this.vm.settings = {};
        };
        DisplayController.prototype.save = function () {
            this.storage.Settings = this.vm.settings;
            this.storage.SaveToLocalStorage();
        };
        DisplayController.prototype.reload = function (key) {
            var value = this.storage.GetImmediate(key);
            if (value === undefined)
                delete this.vm.settings[key];
            else
                this.vm.settings[key] = value;
        };

        DisplayController.prototype.toggleDefault = function (key) {
            if (this.vm.settings[key] === undefined) {
                this.vm.settings[key] = this.storage.GetWithoutSelf(key); //TODO
            } else {
                delete this.vm.settings[key];
            }
        };

        DisplayController.prototype.isDefaultSetting = function (key) {
            return this.vm.settings[key] === undefined;
        };
        DisplayController.prototype.hasSettingChanged = function (key) {
            var newValue = this.vm.settings[key];
            var currentValue = this.storage.GetImmediate(key);
            return !angular.equals(newValue, currentValue);
        };

        DisplayController.prototype.setSelection = function (wrappedSection) {
            if (this.vm.selectedTreeNode)
                this.vm.selectedTreeNode.isSelected = false;
            this.vm.selectedTreeNode = wrappedSection;
            wrappedSection.isSelected = true;

            this.vm.selectedSection = this.flattenToEntries(wrappedSection.base);
            this.vm.descriptionUrl = wrappedSection.base.descriptionUrl;
        };

        DisplayController.prototype.flattenTree = function (section) {
            var sections = [];
            Helper.traverseSchemaSections(section, "", function (path, depth, section) {
                sections.push({
                    base: section,
                    depth: depth
                });
            }, null);

            return sections;
        };
        DisplayController.prototype.flattenToEntries = function (section) {
            var sections = [];

            Helper.traverseSchemaSections(section, ".", function (path, depth, sec) {
                if (!sec.entries)
                    return;
                sections.push({
                    base: sec,
                    path: path
                });
            }, null);

            return sections;
        };
        return DisplayController;
    })();
    SettingsVitrine.DisplayController = DisplayController;

    var ItemPickerBinding = (function () {
        function ItemPickerBinding($scope) {
            var _this = this;
            this.noInit = false;
            this.vm = {
                availableItems: [],
                chosenItems: [],
                selectedAvailable: null,
                selectedChosen: null,
                add: function () {
                    return _this.add();
                },
                remove: function () {
                    return _this.remove();
                },
                moveUp: function () {
                    return _this.moveUp();
                },
                moveDown: function () {
                    return _this.moveDown();
                },
                getName: function (item) {
                    return _this.$scope.parameters.getName(item);
                }
            };
            this.$scope = $scope;
            $scope.vm = this.vm;

            this.items = $scope.parameters.items;

            if (!$scope.parameters.getName)
                $scope.parameters.getName = function (x) {
                    return x;
                };
            if (!$scope.parameters.getValue)
                $scope.parameters.getValue = function (x) {
                    return x;
                };

            $scope.$watch("value", function () {
                if (!_this.noInit)
                    _this.init();
                _this.noInit = false;
            });
            this.init();
        }
        ItemPickerBinding.prototype.init = function () {
            var values = this.$scope.value || this.$scope.defValue;

            this.vm.chosenItems = [];
            this.vm.availableItems = [];

            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i] == null)
                    continue;

                var foundIndex;
                if ((foundIndex = values.indexOf(this.getValue(this.items[i]))) >= 0) {
                    //this.vm.chosenItems.push(this.items[i]);
                    this.vm.chosenItems[foundIndex] = this.items[i];
                } else {
                    this.vm.availableItems.push(this.items[i]);
                }
            }

            if (this.vm.chosenItems.length > 0)
                this.vm.selectedChosen = this.vm.chosenItems[0];
            if (this.vm.availableItems.length > 0)
                this.vm.selectedAvailable = this.vm.availableItems[0];
        };

        ItemPickerBinding.prototype.add = function () {
            var aIndex = this.vm.availableItems.indexOf(this.vm.selectedAvailable);
            if (aIndex < 0)
                return;

            this.vm.availableItems.splice(aIndex, 1);
            this.vm.chosenItems.push(this.vm.selectedAvailable);

            if (this.vm.availableItems.length > 0)
                this.vm.selectedAvailable = this.vm.availableItems[0];
            this.save();
        };
        ItemPickerBinding.prototype.remove = function () {
            var cIndex = this.vm.chosenItems.indexOf(this.vm.selectedChosen);
            if (cIndex < 0)
                return;

            this.vm.chosenItems.splice(cIndex, 1);
            this.vm.availableItems.push(this.vm.selectedChosen);

            if (this.vm.chosenItems.length > 0) {
                cIndex = cIndex > 0 ? cIndex - 1 : 0;
                this.vm.selectedChosen = this.vm.chosenItems[cIndex];
            } else {
                this.vm.selectedChosen = null;
            }
            this.save();
        };
        ItemPickerBinding.prototype.moveUp = function () {
            var cIndex = this.vm.chosenItems.indexOf(this.vm.selectedChosen);
            if (cIndex == 0)
                return;

            var tmp = this.vm.chosenItems[cIndex - 1];
            this.vm.chosenItems[cIndex - 1] = this.vm.chosenItems[cIndex];
            this.vm.chosenItems[cIndex] = tmp;
            this.save();
        };
        ItemPickerBinding.prototype.moveDown = function () {
            var cIndex = this.vm.chosenItems.indexOf(this.vm.selectedChosen);
            if (cIndex >= this.vm.chosenItems.length - 1)
                return;

            var tmp = this.vm.chosenItems[cIndex + 1];
            this.vm.chosenItems[cIndex + 1] = this.vm.chosenItems[cIndex];
            this.vm.chosenItems[cIndex] = tmp;
            this.save();
        };
        ItemPickerBinding.prototype.save = function () {
            var values = [];
            for (var i = 0; i < this.vm.chosenItems.length; i++) {
                values.push(this.getValue(this.vm.chosenItems[i]));
            }

            this.noInit = true;
            this.$scope.value = values;
        };

        ItemPickerBinding.prototype.getValue = function (item) {
            return this.$scope.parameters.getValue(item);
        };
        return ItemPickerBinding;
    })();
    SettingsVitrine.ItemPickerBinding = ItemPickerBinding;

    SettingsVitrine.SVModule;
    function register(angular) {
        if (!angular)
            return;

        SettingsVitrine.SVModule = angular.module("settingsVitrine", []);

        SettingsVitrine.SVModule.filter('range', function () {
            return function (val, range) {
                for (var i = 0; i < range; i++)
                    val.push(i);
                return val;
            };
        });

        SettingsVitrine.SVModule.directive('svDisplay', function () {
            return {
                restrict: 'E',
                templateUrl: SettingsVitrine.DisplayTemplateUrl,
                scope: { storage: "=" },
                replace: true,
                controller: function ($scope) {
                    return new SettingsVitrine.DisplayController($scope, $scope.storage);
                }
            };
        });

        SettingsVitrine.SVModule.directive("svDirectiveProxy", function ($compile) {
            return {
                restrict: 'E',
                scope: { entry: "=", value: "=", defValue: "=" },
                replace: true,
                link: function (scope, element, attrs, ctrl) {
                    var templateStr = "<" + scope.entry.bindingDirective + ' parameters="entry.bindingParameters" value="value" def-value="defValue"></' + scope.entry.bindingDirective + ">";
                    var compiledElem = $compile(templateStr)(scope);
                    element.replaceWith(compiledElem);
                }
            };
        });

        SettingsVitrine.SVModule.directive('svTextboxlabelBinding', function () {
            return {
                restrict: 'E',
                template: '<div><span ng-if="parameters.labelFirst" class="text">{{parameters.labelText}}</span><input ng-model="value" type="text" ng-class="parameters.cssClasses" /><span ng-if="!parameters.labelFirst" class="text"> {{parameters.labelText}}</span></div>',
                scope: { parameters: "=", value: "=" },
                replace: true
            };
        });
        SettingsVitrine.SVModule.directive('svAnidbcsspickerBinding', function () {
            return {
                restrict: 'E',
                template: '<div>svAnidbcsspickerBinding</div>',
                //templateUrl: 'templates/display.html',
                scope: {},
                replace: true
            };
        });

        SettingsVitrine.SVModule.directive('svCheckboxlabelBinding', function () {
            return {
                restrict: 'E',
                template: '<label><input ng-model="value" type="checkbox" /><span class="text"> {{parameters.labelText}}</span></label>',
                //templateUrl: 'templates/display.html',
                scope: { parameters: "=", value: "=" },
                replace: true
            };
        });
        SettingsVitrine.SVModule.directive('svDropdownlabelBinding', function () {
            return {
                restrict: 'E',
                template: '<div><select ng-model="selectedItem" ng-change="itemChanged()" ng-options="item as parameters.getName(item) for item in items | orderBy: parameters.getName"></select><span class="text"> {{parameters.labelText}}</span></div>',
                //templateUrl: 'templates/display.html',
                scope: { parameters: "=", value: "=", defValue: "=" },
                replace: true,
                link: function (scope, element, attrs, ctrl) {
                    if (!scope.parameters.getName)
                        scope.parameters.getName = function (x) {
                            return x;
                        };
                    if (!scope.parameters.getValue)
                        scope.parameters.getValue = function (x) {
                            return x;
                        };

                    var items = [];
                    var value = scope.value || scope.defValue;
                    for (var i = 0; i < scope.parameters.items.length; i++) {
                        var item = scope.parameters.items[i];
                        if (item == null)
                            continue;
                        items.push(item);
                        if (scope.parameters.getValue(item) == value)
                            scope.selectedItem = item;
                    }
                    scope.items = items;

                    scope.itemChanged = function () {
                        scope.value = scope.parameters.getValue(scope.selectedItem);
                    };
                    scope.$watch("value", function () {
                        var val = scope.value || scope.defValue;
                        for (var i = 0; i < items.length; i++) {
                            if (scope.parameters.getValue(items[i]) == val)
                                scope.selectedItem = items[i];
                        }
                    });
                }
            };
        });
        SettingsVitrine.SVModule.directive('svTimezonepickerBinding', function () {
            return {
                restrict: 'E',
                template: '<div>svTimezonepickerBinding</div>',
                //templateUrl: 'templates/display.html',
                scope: {},
                replace: true
            };
        });

        SettingsVitrine.SVModule.directive('svBlocktabsectionpickerBinding', function () {
            return {
                restrict: 'E',
                template: '<div>svBlocktabsectionpickerBinding</div>',
                //templateUrl: 'templates/display.html',
                scope: {},
                replace: true
            };
        });
        SettingsVitrine.SVModule.directive('svItempickerBinding', function () {
            return {
                restrict: 'E',
                templateUrl: 'templates/sv/itempicker.html',
                scope: { parameters: "=", value: "=", defValue: "=" },
                replace: true,
                controller: function ($scope) {
                    return new SettingsVitrine.ItemPickerBinding($scope);
                }
            };
        });
        SettingsVitrine.SVModule.directive('svAnidbfeedBinding', function () {
            return {
                restrict: 'E',
                template: '<div>svAnidbfeedBinding</div>',
                //templateUrl: 'templates/display.html',
                scope: {},
                replace: true
            };
        });
        SettingsVitrine.SVModule.directive('svAnidbjabberBinding', function () {
            return {
                restrict: 'E',
                template: '<div>svAnidbjabberBinding</div>',
                //templateUrl: 'templates/display.html',
                scope: {},
                replace: true
            };
        });
    }
    SettingsVitrine.register = register;
})(SettingsVitrine || (SettingsVitrine = {}));

SettingsVitrine.register(angular);
//# sourceMappingURL=settingsVitrine.js.map
