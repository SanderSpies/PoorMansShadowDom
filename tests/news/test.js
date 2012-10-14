window['FooterComponent'] = function FooterComponent(el) {
	if (!el) {
		el = originalCreateElement.call(document, 'footer');
	}
	el.setAttribute('is', 'x-todo-footer');
	var temp = (function () {
		var FooterComponent = function FooterComponent() {
		};
		;
		if (FooterComponent) {
			return FooterComponent.prototype;
		} else {
			return null;
		}
	}).(instance);
	if (temp) {
		for (var protoName in temp) {
			el[protoName] = temp[protoName];
		}
	}
	return el;
}