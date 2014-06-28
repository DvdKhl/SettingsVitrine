///<reference path="ThirdParty/DefinitelyTyped/angularjs/angular.d.ts" />

module SettingsVitrine {
    class Helper {
        public static traverseSchemaSections(
            section: SchemaSection, separator: string,
            sectionsCallback: (path: string, depth: number, section: SchemaSection) => void,
            entriesCallback: (path: string, depth: number, entry: SchemaEntry) => void
            ) {

            if(sectionsCallback) sectionsCallback(section.name, 0, section);

            if(entriesCallback && section.entries) {
                for(var i = 0; i < section.entries.length; i++) {
                    var entry = section.entries[i];
                    entriesCallback(entry.name, 1, entry);
                }
            }

            if(section.sections) Helper.traverseSchemaSectionsSub(section.sections, separator, "", 1, sectionsCallback, entriesCallback);
        }

        private static traverseSchemaSectionsSub(sections: SchemaSection[], separator: string, path: string, depth: number, sectionsCallback, entriesCallback) {
            for(var i = 0; i < sections.length; i++) {
                var section = sections[i];
                var entryPath = path + section.name;

                if(sectionsCallback) sectionsCallback(entryPath, depth, section);

                if(entriesCallback && section.entries) {
                    for(var j = 0; j < section.entries.length; j++) {
                        var entry = section.entries[j];
                        entriesCallback(entryPath + separator + entry.name, depth + 1, entry);
                    }
                }

                if(section.sections) Helper.traverseSchemaSectionsSub(section.sections, separator, entryPath + separator, depth + 1, sectionsCallback, entriesCallback);
            }
        }
    }

    export var Unset = {};
    export var DisplayTemplateUrl = 'SettingsVitrine/Templates/display.html';

    export interface SchemaSection {
        name: string;
        sections: SchemaSection[];
        entries: SchemaEntry[];
    }
    export interface SchemaEntry {
        name: string;
        defaultValue: any;
        bindingDirective: string;
        bindingParameters: any;
    }

    export class SettingsProxy {
        private storage: SettingsStorage;
        private pathPrefix: string;

        constructor(storage: SettingsStorage, pathPrefix: string) {
            this.storage = storage;
            this.pathPrefix = pathPrefix + ".";
        }

        public Set(key: string, value: any): boolean { return this.storage.Set(this.pathPrefix + key, value); }
        public Get(key: string): any { return this.storage.Get(this.pathPrefix + key); }
        public GetWithoutSelf(key: string): any { return this.storage.GetWithoutSelf(this.pathPrefix + key); }
        public GetSchemaDefault(key: string): any { return this.storage.GetSchemaDefault(this.pathPrefix + key); }
        public GetImmediate(key: string): any { return this.storage.GetImmediate(this.pathPrefix + key); }
        public GetNoSchemaDefault(key: string): any { return this.storage.GetNoSchemaDefault(this.pathPrefix + key); }
    }

    export interface SettingsStorageProviderInfo {
    }
    export interface SettingsStorageProviderData {
        parentName: string;
        settings: { [key: string]: any }
    }
    export interface SettingsStorageProvider {
        GetInfo(name: string): SettingsStorageProviderInfo;
        GetData(name: string): SettingsStorageProviderData;
        SetData(name: string, data: SettingsStorageProviderData): void;
    }
    class LocalStorageProvider implements SettingsStorageProvider {
        GetInfo(name: string): SettingsStorageProviderInfo { throw Error("LocalStorageProvider.getInfo: Not Implemented"); }
        GetData(name: string): SettingsStorageProviderData { return JSON.parse(localStorage.getItem(name)); }
        SetData(name: string, data: SettingsStorageProviderData) { localStorage.setItem(name, JSON.stringify(data)); }
    }

    export class SettingsStorage {
        private schema: SchemaSection;
        private schemaEntries: { path: string; depth: number; base: SchemaEntry }[];

        private name: string;
        private parent: SettingsStorage;
        private settings: { [key: string]: any };

        public get Schema(): SchemaSection { return this.schema; }
        public get Parent(): SettingsStorage { return this.parent; }

        public static LocalStorageProvider = new LocalStorageProvider();

        constructor(name: string, schema: SchemaSection, parent: SettingsStorage = null, settings: { [key: string]: any } = null) {
            this.name = name;
            this.schema = schema;

            this.schemaEntries = [];
            var entriesCallback = (path, depth, entry) => {
                this.schemaEntries[path] = {
                    path: path,
                    depth: depth,
                    base: entry
                };
            };
            Helper.traverseSchemaSections(schema, ".", null, entriesCallback);


            this.settings = settings || {};
            this.parent = parent;
        }

        public Set(key: string, value: any): boolean {
            if(value === undefined) return false;

            if(value === SettingsVitrine.Unset) {
                delete this.settings[key];
            } else if(key in this.schemaEntries) {
                this.settings[key] = value;
            } else {
                return false;
            }
            return true;
        }
        public SetMultiple(settings: { [key: string]: any }) {
            for(var setting in settings) this.Set(setting, settings[setting]);
        }

        public Get(key: string): any {
            var value = undefined;
            if(key in this.settings) {
                value = this.settings[key];
            } else if(this.parent) {
                value = this.parent.Get(key);
            } else if(key in this.schemaEntries) {
                var entry = <SchemaEntry>this.schemaEntries[key].base;
                value = entry.defaultValue || null;
            } else {
                console.log("SettingsStorage.Get: Key " + key + " not in schema");
            }

            return value;
        }
        public GetWithoutSelf(key: string): any {
            var value = undefined;
            if(this.parent) {
                value = this.parent.Get(key);
            } else if(key in this.schemaEntries) {
                var entry = <SchemaEntry>this.schemaEntries[key].base;
                value = entry.defaultValue || null;
            }
            return value;
        }
        public GetSchemaDefault(key: string): any {
            var value = undefined;
            if(key in this.schemaEntries) {
                var entry = <SchemaEntry>this.schemaEntries[key].base;
                value = entry.defaultValue || null;
            } else {
                console.log("SettingsStorage.GetSchemaDefault: Key " + key + " not in schema");
            }
            return value;
        }
        public GetImmediate(key: string): any { return this.settings[key]; }
        public GetNoSchemaDefault(key: string): any {
            var value = undefined;
            if(key in this.settings) {
                value = this.settings[key];
            } else if(this.parent) {
                value = this.parent.GetNoSchemaDefault(key);
            }
            return value;
        }

        public ClearAll() { this.settings = {}; }
        public CreateProxy(keyPrefix: string): SettingsProxy { return new SettingsProxy(this, keyPrefix); }

        public CreateDeriving(name: string): SettingsStorage { return new SettingsStorage(name, this.schema, this); }

        public SaveToLocalStorage() { this.SaveTo(SettingsStorage.LocalStorageProvider); }
        public SaveTo(provider: SettingsStorageProvider) {
            var curStorage = this;

            while(curStorage) {
                var parentName = curStorage.parent ? curStorage.parent.name : null;
                provider.SetData(this.schema.name + "." + curStorage.name, { parentName: parentName, settings: curStorage.settings });
                curStorage = curStorage.parent || null;
            }
        }

        public static LoadFromLocalStorage(name: string, schema: SchemaSection) { return this.LoadFrom(name, schema, SettingsStorage.LocalStorageProvider); }
        public static LoadFrom(name: string, schema: SchemaSection, provider: SettingsStorageProvider) {
            var storage = new SettingsStorage(name, schema);

            var curStorage = storage;
            var fullName = schema.name + "." + name;
            while(fullName) {
                var data = provider.GetData(fullName);
                if(!data) {
                    console.log("SettingsStorage.LoadFrom: Settings with name " + fullName + " not found.");
                    return null;
                }

                curStorage.settings = data.settings;

                if(data.parentName) {
                    curStorage.parent = new SettingsStorage(data.parentName, schema);
                    curStorage = curStorage.parent;

                    fullName = data.parentName ? schema.name + "." + data.parentName : null;
                } else fullName = null;
            }

            return storage;
        }

        public get Keys(): string[] { return (<any>this.settings).keys(); }
        public get Settings(): { [key: string]: any } { return this.settings; }
        public set Settings(settings: { [key: string]: any }) { this.settings = settings; }
    }

    export class DisplayController {
        private $scope: any;
        private storage: SettingsStorage;

        private vm = {
            settings: <{ [key: string]: any }>{},

            sections: [],
            selectedSection: null,
            selectedTreeNode: null,
            descriptionUrl: "",

            setSelection: (section) => this.setSelection(section),
            hasSettingChanged: (key: string) => this.hasSettingChanged(key),
            isDefaultSetting: (key: string) => this.isDefaultSetting(key),
            reload: (key: string) => this.reload(key),
            toggleDefault: (key: string) => this.toggleDefault(key),
            resetDescription: () => this.resetDescription(),
            getDefault: (key) => this.storage.GetSchemaDefault(key),
            reloadAll: () => this.reloadAll(),
            unsetAll: () => this.unsetAll(),
            save: () => this.save(),

            replaceAll: (str: string, pattern, replace) => { return str.replace(new RegExp(pattern, "g"), replace); },
        };


        constructor($scope, storage: SettingsStorage) {
            this.$scope = $scope;
            $scope.vm = this.vm;

            this.storage = storage;
            this.vm.settings = angular.extend({}, storage.Settings);

            this.vm.sections = this.flattenTree(storage.Schema);
            this.setSelection(this.vm.sections[0]);

            this.resetDescription();
        }

        private resetDescription() { this.vm.descriptionUrl = "templates/sv/intro.html"; }
        private reloadAll() { this.vm.settings = angular.extend({}, this.storage.Settings); }
        private unsetAll() { this.vm.settings = {}; }
        private save() {
            this.storage.Settings = angular.extend({}, this.vm.settings);
            this.storage.SaveToLocalStorage();
        }
        private reload(key) {
            var value = this.storage.GetImmediate(key);
            if(value === undefined) delete this.vm.settings[key];
            else this.vm.settings[key] = value;
        }

        private toggleDefault(key) {
            if(this.vm.settings[key] === undefined) {
                this.vm.settings[key] = this.storage.GetWithoutSelf(key);
            } else {
                delete this.vm.settings[key];
            }
        }

        private isDefaultSetting(key): boolean { return this.vm.settings[key] === undefined; }
        private hasSettingChanged(key): boolean {
            var newValue = this.vm.settings[key];
            var currentValue = this.storage.GetImmediate(key);
            return !angular.equals(newValue, currentValue);
        }

        private setSelection(wrappedSection) {
            if(this.vm.selectedTreeNode) this.vm.selectedTreeNode.isSelected = false;
            this.vm.selectedTreeNode = wrappedSection;
            wrappedSection.isSelected = true;

            this.vm.selectedSection = this.flattenToEntries(wrappedSection.base);
            this.vm.descriptionUrl = wrappedSection.base.descriptionUrl;
        }

        private flattenTree(section: SchemaSection): any[] {
            var sections = [];
            Helper.traverseSchemaSections(section, "", (path, depth, section) => {
                sections.push({
                    base: section,
                    depth: depth,
                });
            }, null);

            return sections;
        }
        private flattenToEntries(section: SchemaSection): any[] {
            var sections = [];

            Helper.traverseSchemaSections(section, ".", (path, depth, sec) => {
                if(!sec.entries) return;
                sections.push({
                    base: sec,
                    path: path,
                });
            }, null);

            return sections;
        }
    }

    export class ItemPickerBinding {
        private $scope;

        private items: any[];
        private noInit: boolean = false;

        private vm = {
            availableItems: [],
            chosenItems: [],

            selectedAvailable: null,
            selectedChosen: null,

            add: () => this.add(),
            remove: () => this.remove(),
            moveUp: () => this.moveUp(),
            moveDown: () => this.moveDown(),

            getName: (item) => this.$scope.parameters.getName(item)
        }


        constructor($scope) {
            this.$scope = $scope;
            $scope.vm = this.vm;

            this.items = $scope.parameters.items;

            if(!$scope.parameters.getName) $scope.parameters.getName = (x) => x;
            if(!$scope.parameters.getValue) $scope.parameters.getValue = (x) => x;

            $scope.$watch("value", () => { if(!this.noInit) this.init(); this.noInit = false; });
            this.init();
        }

        private init() {
            var values = this.$scope.value || this.$scope.defValue;

            this.vm.chosenItems = [];
            this.vm.availableItems = [];

            for(var i = 0; i < this.items.length; i++) {
                if(this.items[i] == null) continue;

                var foundIndex: number;
                if((foundIndex = values.indexOf(this.getValue(this.items[i]))) >= 0) {
                    this.vm.chosenItems[foundIndex] = this.items[i];
                } else {
                    this.vm.availableItems.push(this.items[i]);
                }
            }


            if(this.vm.chosenItems.length > 0) this.vm.selectedChosen = this.vm.chosenItems[0];
            if(this.vm.availableItems.length > 0) this.vm.selectedAvailable = this.vm.availableItems[0];
        }

        private add() {
            var aIndex = this.vm.availableItems.indexOf(this.vm.selectedAvailable);
            if(aIndex < 0) return;

            this.vm.availableItems.splice(aIndex, 1);
            this.vm.chosenItems.push(this.vm.selectedAvailable);

            if(this.vm.availableItems.length > 0) this.vm.selectedAvailable = this.vm.availableItems[0];
            this.save();
        }
        private remove() {
            var cIndex = this.vm.chosenItems.indexOf(this.vm.selectedChosen);
            if(cIndex < 0) return;

            this.vm.chosenItems.splice(cIndex, 1);
            this.vm.availableItems.push(this.vm.selectedChosen);

            if(this.vm.chosenItems.length > 0) {
                cIndex = cIndex > 0 ? cIndex - 1 : 0;
                this.vm.selectedChosen = this.vm.chosenItems[cIndex];
            } else {
                this.vm.selectedChosen = null;
            }
            this.save();
        }
        private moveUp() {
            var cIndex = this.vm.chosenItems.indexOf(this.vm.selectedChosen);
            if(cIndex == 0) return;

            var tmp = this.vm.chosenItems[cIndex - 1];
            this.vm.chosenItems[cIndex - 1] = this.vm.chosenItems[cIndex];
            this.vm.chosenItems[cIndex] = tmp;
            this.save();
        }
        private moveDown() {
            var cIndex = this.vm.chosenItems.indexOf(this.vm.selectedChosen);
            if(cIndex >= this.vm.chosenItems.length - 1) return;

            var tmp = this.vm.chosenItems[cIndex + 1];
            this.vm.chosenItems[cIndex + 1] = this.vm.chosenItems[cIndex];
            this.vm.chosenItems[cIndex] = tmp;
            this.save();
        }
        private save() {
            var values = [];
            for(var i = 0; i < this.vm.chosenItems.length; i++) {
                values.push(this.getValue(this.vm.chosenItems[i]));
            }

            this.noInit = true;
            this.$scope.value = values;
        }

        private getValue(item) { return this.$scope.parameters.getValue(item); }

    }

    export var SVModule: ng.IModule
    export function Register(angular: ng.IAngularStatic) {
        if(!angular) return;

        SVModule = angular.module("settingsVitrine", []);

        SVModule.filter('range', function() {
            return function(val, range) {
                for(var i = 0; i < range; i++) val.push(i);
                return val;
            };
        });

        SVModule.directive('svDisplay', () => {
            return {
                restrict: 'E',
                templateUrl: SettingsVitrine.DisplayTemplateUrl,
                scope: { storage: "=" },
                replace: true,
                controller: ($scope) => new SettingsVitrine.DisplayController($scope, $scope.storage)
            };
        });

        SVModule.directive("svDirectiveProxy", ($compile) => {
            return {
                restrict: 'E',
                scope: { entry: "=", value: "=", defValue: "=" },
                replace: true,
                link: function(scope, element, attrs, ctrl) {
                    var templateStr = "<" + scope.entry.bindingDirective + ' parameters="entry.bindingParameters" value="value" def-value="defValue"></' + scope.entry.bindingDirective + ">";
                    var compiledElem = $compile(templateStr)(scope);
                    element.replaceWith(compiledElem);
                }
            };
        });

        SVModule.directive('svTextboxlabelBinding', () => {
            return {
                restrict: 'E',
                template: '<div><span ng-if="parameters.labelFirst" class="text">{{parameters.labelText}}</span><input ng-model="value" type="text" ng-class="parameters.cssClasses" /><span ng-if="!parameters.labelFirst" class="text"> {{parameters.labelText}}</span></div>',
                scope: { parameters: "=", value: "=" },
                replace: true,
            };
        });

        SVModule.directive('svCheckboxlabelBinding', () => {
            return {
                restrict: 'E',
                template: '<label><input ng-model="value" type="checkbox" /><span class="text"> {{parameters.labelText}}</span></label>',
                scope: { parameters: "=", value: "=" },
                replace: true,
            };
        });
        SVModule.directive('svDropdownlabelBinding', () => {
            return {
                restrict: 'E',
                template: '<div><select ng-model="selectedItem" ng-change="itemChanged()" ng-options="item as parameters.getName(item) for item in items | orderBy: parameters.getName"></select><span class="text"> {{parameters.labelText}}</span></div>',
                scope: { parameters: "=", value: "=", defValue: "=" },
                replace: true,
                link: (scope, element, attrs, ctrl) => {
                    if(!scope.parameters.getName) scope.parameters.getName = (x) => x;
                    if(!scope.parameters.getValue) scope.parameters.getValue = (x) => x;

                    var items = [];
                    var value = scope.value || scope.defValue;
                    for(var i = 0; i < scope.parameters.items.length; i++) {
                        var item = scope.parameters.items[i];
                        if(item == null) continue;
                        items.push(item);
                        if(scope.parameters.getValue(item) == value) scope.selectedItem = item;
                    }
                    scope.items = items;

                    scope.itemChanged = () => { scope.value = scope.parameters.getValue(scope.selectedItem); };
                    scope.$watch("value", () => {
                        var val = scope.value || scope.defValue;
                        for(var i = 0; i < items.length; i++) {
                            if(scope.parameters.getValue(items[i]) == val) scope.selectedItem = items[i];
                        }
                    })
            }
            };
        });
        SVModule.directive('svTimezonepickerBinding', () => {
            return {
                restrict: 'E',
                template: '<div>svTimezonepickerBinding</div>',
                scope: {},
                replace: true,
            };
        });

        SVModule.directive('svBlocktabsectionpickerBinding', () => {
            return {
                restrict: 'E',
                template: '<div>svBlocktabsectionpickerBinding</div>',
                scope: {},
                replace: true,
            };
        });
        SVModule.directive('svItempickerBinding', () => {
            return {
                restrict: 'E',
                templateUrl: 'templates/sv/itempicker.html',
                scope: { parameters: "=", value: "=", defValue: "=" },
                replace: true,
                controller: ($scope) => new SettingsVitrine.ItemPickerBinding($scope)
            };
        });
    }
}

SettingsVitrine.Register(angular);