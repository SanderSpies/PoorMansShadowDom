(function(){
	var webComponents = {};

	var WebComponentsLoader = function WebComponentsLoader(){
		var linkTags = document.querySelectorAll("link");
		for(var i = 0, l = linkTags.length; i < l; i++){
			var linkTag = linkTags[i];
			var relAttribute = linkTag.getAttribute("rel");
			if(relAttribute && relAttribute === "components"){
				var href = linkTag.getAttribute("href");
				var xhr = new XMLHttpRequest();
				xhr.open("get", href, false);
				xhr.send(null);

				
				var doc = !window.ActiveXObject ? document.implementation.createHTMLDocument('', 'html', null) : new ActiveXObject("htmlfile");
				doc.open("text/html", "replace");
				
				doc.write(xhr.responseText);
				doc.close();
				var elements = doc.querySelectorAll("element");
				for(var i = 0, l = elements.length; i < l; i++){
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
		


		//TODO: need a better way that also supports createElementNS...
		document.createElement = function createElement(txt){
			if(webComponents[txt]){
				var component = document.createElementNS("http://www.w3.org/1999/xhtml", webComponents[txt].extends);
				component.setAttribute("is", txt);
				return component;
			}
			else {
				return document.createElementNS("http://www.w3.org/1999/xhtml", txt);
			}
		};

		// make sure we can invoke the elements in JS
		// need to do some extra work here...
		for(var compName in webComponents){
			var component = webComponents[compName];
			if(component.constructor){
				var proto = "";
				if(webComponents[compName].element.getElementsByTagName("script").length > 0){
					for(var i = 0, l = webComponents[compName].element.getElementsByTagName("script").length; i < l; i++){
						proto += webComponents[compName].element.getElementsByTagName("script")[i].innerHTML;
					}
				}

				//todo (function(){ this.lifecycle })(parentEl)
				eval("window['" + component.constructor + "'] = function " + component.constructor + "(el){if(!el){el = document.createElement('" + compName + "');} " +
					proto.replace(new RegExp(component.constructor + ".prototype", "g"), "el") + " return el;} " );
				//TODO: add constructor prototype support via script tag

			}
		}
		setTimeout(function(){
		for(var compName in webComponents){
			var usingEls = document.querySelectorAll("[is='" + compName + "']");
			for(var i = 0, l = usingEls.length; i < l; i++){
				var el = usingEls[i];
				if(webComponents[compName].element.getElementsByTagName("template").length > 0){
					var shadowDom = new ShadowRootPolyfill(new window[component.constructor](el));
					shadowDom.innerHTML(webComponents[compName].element.getElementsByTagName("template")[0].innerHTML);
				}
			}
		}
		}, 0);

			//TODO: listen to dom manipulation ('is=' stuff)

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