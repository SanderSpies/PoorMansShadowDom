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
				for (var i = 0, l = elements.length; i < l; i++) {
					var element = elements[i];
					var name = element.getAttribute("name");
					webComponents[name] = {};
					webComponents[name].document = doc;
					webComponents[name].element = element;
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
			var isAttribute = child.getAttribute("is")

			if (isAttribute) {
				if (!(this.children[0] instanceof HTMLIFrameElement)) {
					for (var compName in webComponents) {
						if (compName === isAttribute) {
							var component = webComponents[compName];
							var shadowDom = new ShadowRootPolyfill(new window[component.constructor](child));
							shadowDom.innerHTML(component.element.getElementsByTagName("template")[0].innerHTML);
						}
					}
				}
			}
			else if (!(child instanceof HTMLIFrameElement) && (this.children[0] instanceof HTMLIFrameElement) ) {
				var detached = child.parentNode.removeChild(child);
				var containerDocument = this.children[0].contentDocument;
				var insertionPoints = containerDocument.querySelectorAll("span[class='insertionPointEnd']");
				var nullSelector = null;
				var temp = document.createElement("div");
				temp.appendChild(detached);
				for(var i = 0, l = insertionPoints.length; i < l; i++){
					var insertionPoint = insertionPoints[i];
					var selector = insertionPoint.getAttribute("select");
					if(selector === null){
						nullSelector = insertionPoint;
					}
					else {
						var els = temp.querySelectorAll(selector);
						for(var j = 0, len = els.length; j < len; j++){
							var detached2 = temp.removeChild(els[j]);
							insertionPoint.parentNode.insertBefore(detached2, insertionPoint);
						}
					}
				}

				if(nullSelector){
					for(var i = 0, l = temp.children.length; i < l; i++){
						nullSelector.parentNode.insertBefore(temp.children[i], nullSelector);
					}
				}

				if (containerDocument.body.scrollHeight > this.offsetHeight) {
					this.style.height = containerDocument.body.scrollHeight + "px";
					this.children[0].style.height = containerDocument.body.scrollHeight + "px";
				}
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

		window["HTMLElementElement"] = function HTMLElementElement(){

		};
		window["HTMLElementElement"].prototype = HTMLElement.prototype;

		window["HTMLElementElement"].prototype.lifecycle = function(obj){
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

				proto = "(function(){ var " + component.constructor + " = function " + component.constructor + "(){};  " + proto + "; if( " + component.constructor + "){ return " + component.constructor + ".prototype; } else { return null; } }).call(component.elementInstance)";
				eval("window['" + component.constructor + "'] = function " + component.constructor + "(el){if(!el){el = originalCreateElement.call(document, '" + webComponents[compName].extends + "');} " +
					"el.setAttribute('is', '" + compName + "'); var temp = " + proto + "; if(temp){for(var protoName in temp){el[protoName] = temp[protoName]; }} return el;} ");
			}
		}

		/* end of javascript support */
		for (var compName in webComponents) {
			var usingEls = document.querySelectorAll("[is='" + compName + "']");
			for (var i = 0, l = usingEls.length; i < l; i++) {
				var el = usingEls[i];
				if (webComponents[compName].element.getElementsByTagName("template").length > 0) {
					var instance = new window[component.constructor](el);
					var shadowDom = new ShadowRootPolyfill(instance);
					if(webComponents[compName].elementInstance._lifecycle && webComponents[compName].elementInstance._lifecycle.created){
						webComponents[compName].elementInstance._lifecycle.created.call(instance, shadowDom);
					}
					shadowDom.innerHTML(webComponents[compName].element.getElementsByTagName("template")[0].innerHTML);
					if(webComponents[compName].elementInstance._lifecycle && webComponents[compName].elementInstance._lifecycle.inserted){
						webComponents[compName].elementInstance._lifecycle.inserted.call(instance);
					}
				}
			}
		}
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