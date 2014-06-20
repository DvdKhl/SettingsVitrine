module SettingsVitrine {


    export var DemoSettings : any = {
        name: "Settings",
        sections: [
            {
                name: "theme",
                entries: [
                    {
                        name: "pageCssUrl",
                        defaultValue: "http://static.anidb.net/css/anidbstyle2/anidbstyle2.css",
                        bindingDirective: "sv-textboxlabel-binding"
                    }
                ]
            }, {
                name: "global",
                sections: [
                    {
                        name: "general",
                        entries: [
                            {
                                name: "noMessagePopup",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "No message popup" }
                            }, {
                                name: "hideAllImages",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide all pictures (incl. thumbnails)" }
                            }, {
                                name: "hideAllThumbnails",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide all thumbnails" }
                            }, {
                                name: "showAllWeightOptions",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Show all weight options for categories in search" }
                            }, {
                                name: "hideUserAvatars",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide user avatars" }
                            }, {
                                name: "hideDidYouKnowBar",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide the \"Did you know?\" bar" }
                            }, {
                                name: "hideEvents",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide events" }
                            }, {
                                name: "hoverThumbnails",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide thumbnails in tables and show them on hover" }
                            }, {
                                name: "defaultTextEditorMode",
                                defaultValue: "visual",
                                bindingDirective: "sv-dropdownlabel-binding",
                                bindingParameters: { labelText: "Default Text Editor Mode", items: ["normal", "visual"] }
                            }
                        ]
                    }, {
                        name: "irc",
                        entries: [
                            {
                                name: "excludeFromStats",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide myself in IRC stats" }
                            }
                        ]
                    }, {
                        name: "forum",
                        entries: [
                            {
                                name: "dontParseSmilies",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Don't parse smileys in posts" }
                            }, {
                                name: "hideSignatures",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide signatures in the forum" }
                            }, {
                                name: "hideNonWhitelistedImages",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide images from 3rd party non-whitelisted server" }
                            }, {
                                name: "postCountPerPage",
                                defaultValue: 20,
                                bindingDirective: "sv-textboxlabel-binding",
                                bindingParameters: { labelText: "Number of posts per page", cssClasses: ['smallbox'] }
                            }, {
                                name: "threadCountPerPage",
                                defaultValue: 30,
                                bindingDirective: "sv-textboxlabel-binding",
                                bindingParameters: { labelText: "Number of threads per page", cssClasses: ['smallbox'] }
                            }
                        ]
                    }
                ]
            }, {
                name: "pages",
                sections: [
                    {
                        name: "general",
                        entries: [
                            {
                                name: "alternativeTabPresentation",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Use alternative info tab presentation" }
                            }, {
                                name: "showSpoilerTags",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Show tags marked as spoiler" }
                            }, {
                                name: "hideForeignTitles",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide foreign titles/names (see: lang prefs)" }
                            }, {
                                name: "hideShortTitles",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide short titles/names" }
                            }, {
                                name: "hideEntityImages",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide all entity pictures" }
                            }, {
                                name: "entriesPerPage",
                                defaultValue: false,
                                bindingDirective: "sv-textboxlabel-binding",
                                bindingParameters: { labelText: "Number of entries per page", cssClasses: "smallbox" }
                            }
                        ]
                    },  {
                        name: "user",
                        entries: [
                            {
                                name: "disableBlog",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Disable and hide your blog" }
                            }, {
                                name: "hideDiscussion",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide the Discussion section" }
                            }, {
                                name: "hideAchievements",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide the achievements section" }
                            }, {
                                name: "hideFavorites",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide the favourites section" }
                            }, {
                                name: "hideBuddyRecs",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide the buddy recommendations section" }
                            }, {
                                name: "hideSignature",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Hide the signature section" }
                            }
                        ]
                    }
                ]
            }, {
                name: "notifications",
                sections: [
                    {
                        name: "general",
                        entries: [
                            {
                                name: "byMail",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Notify by mail" }
                            }, {
                                name: "byPopup",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Notify by popup" }
                            }, {
                                name: "clearOnOpen",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "Clear notifies when opening notification history" }
                            }, {
                                name: "noPmOnSubscription",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "By default don't send a pm for subscribed threads. (doesn't affect old subscriptions)" }
                            }, {
                                name: "onPostSubscribe",
                                defaultValue: false,
                                bindingDirective: "sv-checkboxlabel-binding",
                                bindingParameters: { labelText: "By default subscribe to threads when posting" }
                            }
                        ]
                    }
                ]
            }
        ]
    }
}