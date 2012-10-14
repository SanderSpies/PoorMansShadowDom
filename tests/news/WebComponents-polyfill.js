(function () {
	var webComponents = {};

	var WebComponentsLoader = function WebComponentsLoader() {
		var linkTags = document.querySelectorAll("link");
		for (var i = 0, l = linkTags.length; i < l; i++) {
			var linkTag = linkTags[i];
			var relAttribute = linkTag.getAttribute("rel");
			if (relAttribute && relAttribute === "components") {
				var href = linkTag.getAttribute("href");
				var xhr = new XMLHttpRequest();
				xhr.open("get", href, false);
				xhr.send(null);


				var doc = !window.ActiveXObject ? document.implementation.createHTMLDocument('', 'html', null) : new ActiveXObject("htmlfile");
				doc.open("text/html", "replace");

				doc.write(xhr.responseText);
				doc.close();
				var elements = doc.querySelectorAll("element");
				for (var j = 0, len = elements.length; j < len; j++) {
					var element = elements[j];
					var name = element.getAttribute("name");
					webComponents[name] = {};
					webComponents[name].document = doc;
					webComponents[name].element = element;
					webComponents[name].template = element.querySelector("template");
					webComponents[name].instances = [];
					webComponents[name].extends = element.getAttribute("extends");
					webComponents[name].constructor = element.getAttribute("constructor");

				}
			}
		}

		/* start of evil dom overrides */
		var proto2 = HTMLElement.prototype;
		var originalAppendChild = proto2.appendChild;
		proto2.appendChild = function HTMLElement$appendChild(child) {
			originalAppendChild.call(this, child);
			var isAttribute = child.getAttribute("is");
			var parentIsAttribute = this.getAttribute("is");
			var takeChild = false;
			var component = null;
			if (isAttribute) {
				for (var compName in webComponents) {
					if (compName === isAttribute) {
						component = webComponents[compName];
						var shadowDom = new ShadowRootPolyfill(child);
						//console.log(this, this.lifecycle, this.instance);

						webComponents[compName].instances.push(shadowDom);
						shadowDom.innerHTML = component.element.getElementsByTagName("template")[0].innerHTML;



						if (component.element.getAttribute("apply-author-styles")) {
							shadowDom.applyAuthorStyles = true;
						}

					}
				}

				/*	*/
				takeChild = true;
			}

			if (!(child instanceof HTMLIFrameElement) && (this.children[0] instanceof HTMLIFrameElement)) {
				var containerDocument = takeChild ? child.children[0].contentDocument : this.children[0].contentDocument;

				var insertionPoints = containerDocument.querySelectorAll("span[class='insertionPointEnd']");
				var detached = child.parentNode.removeChild(child);
				var nullSelector = null;

				var temp = document.createElement("div");
				originalAppendChild.call(temp, detached);

				for (var i = 0, l = insertionPoints.length; i < l; i++) {
					var insertionPoint = insertionPoints[i];
					var selector = insertionPoint.getAttribute("select");
					if (selector === null) {
						nullSelector = insertionPoint;
					}
					else {
						var els = temp.querySelectorAll(selector);
						for (var j = 0, len = els.length; j < len; j++) {
							var detached2 = temp.removeChild(els[j]);
							insertionPoint.parentNode.insertBefore(detached2, insertionPoint);
						}
					}
				}

				if (nullSelector) {
					for (var i = 0, l = temp.children.length; i < l; i++) {
						nullSelector.parentNode.insertBefore(temp.children[i], nullSelector);
					}
				}

				if (containerDocument.body.scrollHeight > this.offsetHeight) {
					this.style.height = containerDocument.body.scrollHeight + "px";
					this.children[0].style.height = containerDocument.body.scrollHeight + "px";
				}

				if (takeChild) {
					if(component.element.getAttribute("apply-author-styles") !== null){
						shadowDom.applyAuthorStyles = true;
					}
					//var html = containerDocument.documentElement.outerHTML;

					originalAppendChild.call(this.children[0].contentDocument.body, detached);

					var headChildNodes = containerDocument.head.childNodes;
					while(headChildNodes.length){
						detached.childNodes[0].contentDocument.head.appendChild(headChildNodes[0]);
					}

					var bodyChildNodes = containerDocument.body.childNodes;
					while(bodyChildNodes.length){
						detached.childNodes[0].contentDocument.body.appendChild(bodyChildNodes[0]);
					}

					if (component.elementInstance._lifecycle.created) {
						component.elementInstance._lifecycle.created.call(child, shadowDom);
					}
					if (component.elementInstance._lifecycle.inserted) {
						component.elementInstance._lifecycle.inserted.call(child);
					}

					var self = this;
					setTimeout(function(){
						var realHeight = child.childNodes[0].contentDocument.body.scrollHeight;
						child.style.height = realHeight + "px";
						child.children[0].style.height = realHeight + "px";

						var realHeight2 = self.childNodes[0].contentDocument.body.scrollHeight;
						self.style.height = realHeight2 + "px";
						self.children[0].style.height = realHeight2 + "px";
					},0);
				}
			}

			for (var compName in webComponents) {
				for (var i = 0, l = webComponents[compName].instances.length; i < l; i++) {
					webComponents[compName].instances[i].recalcHeight();
				}
			}


		};

		var originalQuerySelector = proto2.querySelector;
		var originalQuerySelectorAll = proto2.querySelectorAll;
		proto2.querySelector = function HTMLElement$querySelector(query) {
			if (this.getAttribute("is") !== null && this.children[0] instanceof HTMLIFrameElement) {
				return this.children[0].contentDocument.body.querySelector(query);
			}
			else {
				return originalQuerySelector.call(this, query);
			}
		};
		proto2.querySelectorAll = function HTMLElement$querySelectorAll(query) {
			if (this.getAttribute("is") !== null && this.children[0] instanceof HTMLIFrameElement) {
				return this.children[0].contentDocument.body.querySelectorAll(query);
			}
			else {
				return originalQuerySelectorAll.call(this, query);
			}
		};

		var originalCreateElement = document.createElement;
		document.createElement = function createElement(txt, skip) {
			if (webComponents[txt]) {
				var component = new (window[webComponents[txt].constructor])();
				return component;
			}
			else {
				return originalCreateElement.call(document, txt);
			}
		};

		window["HTMLElementElement"] = function HTMLElementElement() {

		};
		window["HTMLElementElement"].prototype = HTMLElement.prototype;

		window["HTMLElementElement"].prototype.lifecycle = function (obj) {
			this._lifecycle = obj;
		};
		/* end of evil dom overrides*/

		/* start of javascript support */
		for (var compName in webComponents) {
			var component = webComponents[compName];
			component.elementInstance = new HTMLElementElement();

			if (component.constructor) {
				var proto = "";
				if (webComponents[compName].element.getElementsByTagName("script").length > 0) {
					for (var i = 0, l = webComponents[compName].element.getElementsByTagName("script").length; i < l; i++) {
						proto += webComponents[compName].element.getElementsByTagName("script")[i].innerHTML;
					}
				}
				var me = this;
				(function (instance, template) {

					proto = "(function(instance){ var " + component.constructor + " = function " + component.constructor + "(){};  " + proto + "; if( " + component.constructor + "){ return " + component.constructor + ".prototype; } else { return null; } }).call(instance)";
					eval("window['" + component.constructor + "'] = function " + component.constructor + "(el){ if(!el){el = originalCreateElement.call(document, '" + webComponents[compName].extends + "');} " +
						"el.setAttribute('is', '" + compName + "'); var temp = " + proto + "; this.instance = instance; if(temp){for(var protoName in temp){el[protoName] = temp[protoName]; }} return el;}; ");
				})(component.elementInstance, component.template);
			}
		}

		/* end of javascript support */
		/* parse current markup */
		for (var compName in webComponents) {
			var usingEls = document.querySelectorAll("[is='" + compName + "']");
			for (var i = 0, l = usingEls.length; i < l; i++) {
				var el = usingEls[i];
				if (webComponents[compName].element.getElementsByTagName("template").length > 0) {
					var instance = new window[webComponents[compName].constructor](el);

					var shadowDom = webComponents[compName].shadowDom = new ShadowRootPolyfill(instance);
					webComponents[compName].instances.push(shadowDom);

					if (webComponents[compName].elementInstance._lifecycle && webComponents[compName].elementInstance._lifecycle.created) {
						webComponents[compName].elementInstance._lifecycle.created.call(instance, shadowDom);
					}

					shadowDom.innerHTML = webComponents[compName].element.getElementsByTagName("template")[0].innerHTML;


					if (webComponents[compName].elementInstance._lifecycle && webComponents[compName].elementInstance._lifecycle.inserted) {
						webComponents[compName].elementInstance._lifecycle.inserted.call(instance);
					}

					if (webComponents[compName].element.getAttribute("apply-author-styles") !== null) {
						shadowDom.applyAuthorStyles = true;
					}
				}
			}
		}
		/* end of current markup parsing */
		//
		//TODO: add web components one by one
		// outer el is determined by extends=""
		// inner workings = shadow dom stuff -> use wc template and apply dom contents to it

		// - make sure extends works
		// - keep using the css + js I guess? maybe adjust the path?!
		// - handle the templating stuff ->
		// - where is the starting point for js? where does lifecycle come from?!
		// - wtf style scoped?!
		// - lifecycle stuff from glazkov
		// - eventing stuff
	};


	WebComponentsLoader.prototype = {

	};

	new WebComponentsLoader();
})();