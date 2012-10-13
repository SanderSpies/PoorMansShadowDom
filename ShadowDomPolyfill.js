/**
 * This polyfill tries to emulate the Shadow Dom (see http://www.w3.org/TR/shadow-dom/) by using an iframe.
 *
 * Known issues:
 * - content is wrapped inside a square due to the nature of IFrames, not sure how it will all show up
 * - has only been tested in Chrome / Chrome Canary (10 oct 2012) -> will support more later on
 * -
 * - no applyAuthorStyles support
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

		var root = function ShadowRoot(el) {
			var el = this.el = el;
			this.fragment = document.createDocumentFragment();

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
			container.style.height = "100%";

			var origContent = this.origContent = document.createElement("div");
			origContent.innerHTML = el.innerHTML;
			this.insertedContent = "";

			el.innerHTML = "";

			el.appendChild(container);

			var containerDocument = container.contentWindow.document;
			containerDocument.open("text/html", "replace");
			containerDocument.write("<html><head><style>body{margin:0;padding:0;}</style></head><body></body></html>");
			containerDocument.close();
			var fragment = this.fragment;
			//setTimeout(function () {
				containerDocument.body.appendChild(fragment);
			//}, 0);

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

			this.addStyleSheet = function (stylesheet) {
				if (stylesheet instanceof HTMLLinkElement) {
					containerDocument.getElementsByTagName("head")[0].appendChild(stylesheet);
					return containerDocument.styleSheets[containerDocument.styleSheets.length - 1];
				}
				else if (stylesheet instanceof HTMLStyleElement) {
					this.fragment.appendChild(stylesheet);
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
				changeMe.innerHTML = this.insertedContent;
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
							//matchingEls[j].parentNode.removeChild(matchingEls[j]);
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
				this.fragment = document.createDocumentFragment();
				while (changeMeChildren.length) {
					this.fragment.appendChild(changeMeChildren[0]);
				}

				containerDocument.body.appendChild(this.fragment);

				if (containerDocument.body.scrollHeight > el.offsetHeight) {
					el.style.height = containerDocument.body.scrollHeight + "px";
					container.style.height = containerDocument.body.scrollHeight + "px";

				}

				return changeMe;
			};
		};

		//root.prototype = fragment.prototype;

		Object.defineProperty(root.prototype, 'innerHTML', {
			enumerable:false,
			configurable:true,
			get:function () {
				return this._innerHTML();

			},
			set:function (prop) {
				//console.log("set to:", prop);
				return this._innerHTML(prop);
			}
		});

		return root;

	});
	return new root2;
})();