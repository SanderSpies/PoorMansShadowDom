TodoMVC sample application written with web-components and templates bound to
models. You can run it out of the box on Dartium using dart:mirrors.
That means you can edit it and refresh and see it automatically update.

To run this code, first run our compiler:

    ../../bin/dwc.dart ./main.html

This will generate a number of files with the *.html.dart and *.html.html.
Then you can launch in [Dartium][] with these flags:

    --allow-file-access-from-files --enable-experimental-webkit-features --enable-devtools-experiments

And open `main.html.html`.

You can also compile with [dart2js][] and run it in any of the
[modern browsers][browsers] supported by Dart:

    dart2js -omain.html_bootstrap.dart.js main.html_bootstrap.dart

Note that [TodoMVC][] use CSS features that are not supported yet in all of our
target browsers. If you try running the examples on that site you'll see similar problems with other frameworks. This causes some things to render incorrectly in Firefox, IE9 and Opera, such as checkboxes. We'd like to fix the stylesheet so
it renders the same everywhere, but we haven't done it yet.

[Dartium]: http://www.dartlang.org/dartium/
[dart2js]: http://www.dartlang.org/docs/dart2js/
[browsers]: http://www.dartlang.org/support/faq.html#what-browsers-supported
[TodoMVC]: http://addyosmani.github.com/todomvc/
