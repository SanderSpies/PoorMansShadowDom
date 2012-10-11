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
////var a = ; a.open(); a.write("<html><head><link /></head><body>22222<body></html>"); a.close(); console.log(a.documentElement.innerHTML)
				console.log(doc);
				doc.open("text/html", "replace");
				
				doc.write(xhr.responseText);
				console.log(xhr.responseText);

				//doc.write(xhr.responseText);
				//doc.close();

				var elements = doc.querySelectorAll("element");
				for(var i = 0, l = elements.length; i < l; i++){
					var element = elements[i];
					var name = element.getAttribute("name");
					webComponents[name] = {};
					webComponents[name].document = doc;
					webComponents[name].element = element;	
				}
			}
		}
		
		for(var compName in webComponents){
			console.log(compName, webComponents[compName]);
			var usingEls = document.querySelectorAll("[is='" + compName + "']");
			for(var i = 0, l = usingEls.length; i < l; i++){
				var el = usingEls[i];
				var shadowDom = new ShadowRootPolyfill(el);
//				console.log(webComponents[compName].element.getElementsByTagName("template")[0]);
				shadowDom.innerHTML(webComponents[compName].element.getElementsByTagName("template")[0].innerHTML);
			}
		}

		console.log("web components:", webComponents);

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