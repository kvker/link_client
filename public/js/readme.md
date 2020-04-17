## Toast.min.js

| Parameter     |Description| Default | Values |
| ------------- |-----------| -------  |---------|
| title         | Shows in the top left corner of the toast header | 'Notice!'|        |
| subtitle      | Shows in the top right corner of the toast header | N/A      |        |
| content       | Shows in the toast body | N/A      |        |
| type          | Determines the style of the toast based on Bootstrap styles | 'info'   | 'info', 'success', 'warning', 'error' |
| delay         | Determines how long the Toast shoud be shown for.  The default, -1, will show the toast until the user clicks close. | -1 | omit or set to -1 to disable auto close, or timeout value in milliseconds
| img           | Shows an image before the title | N/A | { src: '', class: '', title: '', alt: '' }
| pause_on_hover| true/false respectively to pause on hover | false | true/false  |
| container     | Set the container inside which the toasts will be displayed | $("body") | A JQuery selector |