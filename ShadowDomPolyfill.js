/**
 * This polyfill tries to emulate the Shadow Dom (see http://www.w3.org/TR/shadow-dom/) by using an iframe.
 *
 * Known issues:
 * - content is wrapped inside a square due to the nature of IFrames, not sure how it will all show up
 * - has only been tested in Chrome / Chrome Canary (10 oct 2012) -> will support more later on
 * -
 * - no resetStyleInheritance support
 * - no activeElement support
 *
 * If all hell breaks loose -> call someone else!
 *
 * Version 0.1
 *
 * @type {*}
 */
var ShadowRootPolyfill = (function () {
	var root2 = (function () {
		var fragment = document.createDocumentFragment();
		var root = function ShadowRoot(el) {

			var el = this.el = el;
			this.initialHeight = el.offsetHeight;
			this.fragment = fragment || document.createDocumentFragment();

			var container = document.createElement("iframe");
			container.src = "about:blank";

			var onLoad = function () {
				container.removeEventListener("load", onLoad);

				// make sure innerHTML is set before we do this
				// also not totally perfect, but close enough
				setTimeout(function () {
					if (container.contentDocument) {
						container.contentDocument.documentElement.addEventListener("click", function (e) {
							var target = e.target || e.srcElement;
							if (target && target.href && target.href !== "" && typeof(target.onclick) !== "function") {
								e.preventDefault();
								document.location.href = target.href;
							}
						});
					}
				}, 0);
			};

			container.addEventListener("load", onLoad);

			container.setAttribute("frameborder", "0");

			if (!el) {
				throw TypeError("Not enough arguments");
			}
			container.style.width = "100%";
			container.style.height = "0px";
			var origContent = this.origContent = document.createElement("div");
			origContent.innerHTML = el.innerHTML;
			origContent = origContent.cloneNode(true);
			this.insertedContent = "";

			el.innerHTML = "";

			el.appendChild(container);

			if(!el.parentNode){
				//el.style.display = "none";
				document.body.insertBefore(el, document.body.children[0]);
			}

			var containerDocument = container.contentWindow.document;
			containerDocument.open("text/html", "replace");
			containerDocument.write("<html><head><style>html{height:0px;width:100%;}body{margin:0;padding:0;width: 100%;overflow:hidden;}</style></head><body></body></html>");
			containerDocument.close();

			var fragment = this.fragment;

			containerDocument.body.appendChild(fragment);
			if(el.id){
				containerDocument.body.id = el.id;
			}
			if(el.className) {
				containerDocument.body.className = el.className;
			}
			if(el.style){
				containerDocument.body.style = el.style;
			}

			this.querySelector = function querySelector(query){
				return containerDocument.querySelector(query);
			};

			this.querySelectorAll = function querySelectorAll(query){
				return containerDocument.querySelectorAll(query);
			};

			this.getElementById = function getElementById(id) {
				return containerDocument.getElementById(id);
			};

			this.getElementsByClassName = function getElementsByClassName(className) {
				return containerDocument.getElementsByClassName(className);
			};

			this.getElementsByTagName = function (tagName) {
				return containerDocument.getElementsByTagName(tagName);
			};

			this.getElementsByTagNameNS = function (ns, localName) {
				return containerDocument.getElementsByTagNameNS(ns, localName);
			};

			this.getSelection = function () {
				return containerDocument.getSelection();
			};

			this.cloneNode = function () {
				throw new Error("The object can not be cloned.");
			};

			this.styleSheets = containerDocument.styleSheets;

			this.recalcHeight = function(){
				if (containerDocument.body.scrollHeight > el.offsetHeight) {
					el.style.height = containerDocument.body.scrollHeight + "px";
					container.style.height = containerDocument.body.scrollHeight + "px";
				}
			};

			this.addStyleSheet = function (stylesheet) {
				if (stylesheet instanceof HTMLLinkElement) {
					containerDocument.getElementsByTagName("head")[0].appendChild(stylesheet);
					this.recalcHeight();
					return containerDocument.styleSheets[containerDocument.styleSheets.length - 1];
				}
				else if (stylesheet instanceof HTMLStyleElement) {
					containerDocument.head.appendChild(stylesheet);
					this.recalcHeight();
					return stylesheet;
				}
				else {
					throw new Error("The type of the object does not match the expected type.");
				}
			};

			this.removeStyleSheet = function (stylesheet) {
				document.getElementsByTagName("head")[0].removeChild(document.querySelector("link[href='" + stylesheet.href + "']"));
				return stylesheet;
			};

			this._innerHTML = function (html) {
				var el = this.el;
				if (!html) {
					return this.insertedContent;
				}
				else {
					this.insertedContent = html;
				}

				var changeMe = document.createElement("div");
				changeMe.innerHTML = this.insertedContent.trim();
				containerDocument.body.innerHTML = "";

				var insertionPoints = changeMe.querySelectorAll("content");
				var tempOrigContent = this.origContent.cloneNode(true);

				for (var i = 0, l = insertionPoints.length; i < l; i++) {

					var insertionPoint = insertionPoints[i];
					var selector = insertionPoint.getAttribute("select");
					if (selector) {
						var matchingEls = tempOrigContent.querySelectorAll(selector);
						var temp = document.createDocumentFragment();
						for (var j = 0, l2 = matchingEls.length; j < l2; j++) {
							temp.appendChild(matchingEls[j]);
						}
						var el = document.createElement("span");
						el.className = "insertionPointEnd";
						el.setAttribute("select", selector);
						temp.appendChild(el);

						insertionPoint.parentNode.insertBefore(temp, insertionPoint);
						insertionPoint.parentNode.removeChild(insertionPoint);
					}
				}

				for (var i = 0, l = insertionPoints.length; i < l; i++) {
					var insertionPoint = insertionPoints[i];
					var selector = insertionPoint.getAttribute("select");
					if (!selector) {
						var temp = document.createDocumentFragment();
						var c = tempOrigContent.children;

						while (c.length) {
							temp.appendChild(c[0]);
						}

						var el = document.createElement("span");
						el.className = "insertionPointEnd";
						temp.appendChild(el);

						insertionPoint.parentNode.insertBefore(temp, insertionPoint);
						insertionPoint.parentNode.removeChild(insertionPoint);

					}
				}

				var changeMeChildren = changeMe.children;
				var fragment = document.createDocumentFragment();

				while (changeMeChildren.length) {
					fragment.appendChild(changeMeChildren[0]);
				}

				containerDocument.body.appendChild(fragment);

				this.recalcHeight();

				return changeMe;
			};
		};

		root.prototype = fragment;

		Object.defineProperty(root.prototype, 'innerHTML', {
			enumerable:false,
			configurable:true,
			get:function () {
				return this._innerHTML();

			},
			set:function (prop) {
				return this._innerHTML(prop);
			}
		});

		function CleanUpStyleStylesheet(txt) {
			txt = txt.replace(/body/gi, "__removebody__");
			txt = txt.replace(/html/gi, "__removehtml__");
			return txt;
		}

		Object.defineProperty(root.prototype, 'applyAuthorStyles', {
			enumerable:false,
			configurable:true,
			get:function () {
				console.log("TODO: get applyAuthorStyles");
			},
			set:function (prop) {
				var styleSheetLinks = document.head.querySelectorAll("link[rel='stylesheet']");
				for (var i = 0, l = styleSheetLinks.length; i < l; i++) {
					var stylesheet = styleSheetLinks[i];
					var href = stylesheet.getAttribute("href");
					var xhr = new XMLHttpRequest();
					xhr.open("get", href, false);
					xhr.send(null);
					var styleTag = document.createElement("style");
					styleTag.innerHTML = CleanUpStyleStylesheet(xhr.responseText);
					this.addStyleSheet(styleTag);
				}

			}
		});

		Object.defineProperty(root.prototype, 'resetStyleInheritance', {
			enumerable:false,
			configurable:true,
			get:function () {
				console.log("TODO: get resetStyleInheritance");
			},
			set:function (prop) {
				console.log("TODO: set resetStyleInheritance");
			}
		});

		return root;

	});
	return new root2;
})();