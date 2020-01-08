
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.16.5 */

    const { Error: Error_1, Object: Object_1 } = globals;

    function create_fragment(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	const qsPosition = location.indexOf("?");
    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	setTimeout(
    		() => {
    			window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    		},
    		0
    	);
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	setTimeout(
    		() => {
    			const dest = (location.charAt(0) == "#" ? "" : "#") + location;
    			history.replaceState(undefined, undefined, dest);
    			window.dispatchEvent(new Event("hashchange"));
    		},
    		0
    	);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	class RouteItem {
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		match(path) {
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	const routesIterable = routes instanceof Map ? routes : Object.entries(routes);
    	const routesList = [];

    	for (const [path, route] of routesIterable) {
    		routesList.push(new RouteItem(path, route));
    	}

    	let component = null;
    	let componentParams = {};
    	const dispatch = createEventDispatcher();

    	const dispatchNextTick = (name, detail) => {
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => {
    		return {
    			routes,
    			prefix,
    			component,
    			componentParams,
    			$loc
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("$loc" in $$props) loc.set($loc = $$props.$loc);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			 {
    				$$invalidate(0, component = null);
    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						if (!routesList[i].checkConditions(detail)) {
    							dispatchNextTick("conditionsFailed", detail);
    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);
    						$$invalidate(1, componentParams = match);
    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [component, componentParams, routes, prefix];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/loading/index.svelte generated by Svelte v3.16.5 */

    const file = "src/components/loading/index.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let svg;
    	let circle;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(circle, "class", "path svelte-umpdrg");
    			attr_dev(circle, "fill", "none");
    			attr_dev(circle, "stroke-width", "6");
    			attr_dev(circle, "stroke-linecap", "round");
    			attr_dev(circle, "cx", "33");
    			attr_dev(circle, "cy", "33");
    			attr_dev(circle, "r", "30");
    			add_location(circle, file, 78, 4, 1282);
    			attr_dev(svg, "class", "spinner svelte-umpdrg");
    			attr_dev(svg, "width", "65px");
    			attr_dev(svg, "height", "65px");
    			attr_dev(svg, "viewBox", "0 0 66 66");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file, 72, 2, 1154);
    			attr_dev(div, "id", "loading");
    			set_style(div, "display", /*show*/ ctx[0] ? "flex" : "none");
    			attr_dev(div, "class", "svelte-umpdrg");
    			add_location(div, file, 71, 0, 1090);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, circle);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*show*/ 1) {
    				set_style(div, "display", /*show*/ ctx[0] ? "flex" : "none");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { show = false } = $$props;
    	const writable_props = ["show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Loading> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	$$self.$capture_state = () => {
    		return { show };
    	};

    	$$self.$inject_state = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	return [show];
    }

    class Loading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { show: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get show() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    if(!(AV.applicationId && (AV.applicationKey || AV.masterKey))) {
      AV.init({
        appId: 'h7yi7AWU813r5FbiKqXWo7zC-9Nh9j0Va',
        appKey: 'HBMgkORRWCCgmdvkthe81pQ3',
        serverURLs: "https://h7yi7awu.lc-cn-e1-shared.com",
      });
    }

    var av = {
      /**
       * av新增对象
       * @param {string} classs 新增对象的类
       * @param {object} params 新增参数
       */
      async create(classs, params) {
        return await (new (AV.Object.extend(classs))).set(params).save()
      },
      /**
       * av基础获取
       * @param {string} classs 搜索类名
       * @param {function} cbForQuery 设置查询条件的中介函数
       */
      async read(classs, cbForQuery) {
        let query = new AV.Query(classs);
        // 如果需要额外设置条件，则通过传入这个函数处理
        if(cbForQuery) {
          cbForQuery(query);
        }
        return await query.find()
      },
      /**
       * av更新对象
       * @param {string} classs 更新对象的类
       * @param {string} id 更新对象的objectId
       * @param {object} params 更新内容
       */
      async update(classs, id, params) {
        let obj = AV.Object.createWithoutData(classs, id);
        // 设置属性
        for(const key in params) {
          if(params.hasOwnProperty(key)) {
            const element = params[key];
            obj.set(key, element);
          }
        }
        return await obj.save()
      },
      // 批量跟新
      async saveAll(objects) {
        return await AV.Object.saveAll(objects)
      },
      /**
       * av删除对象
       * @param {string} classs 删除对象的类
       * @param {string} id 删除对象的objectId
       */
      async delete(classs, id) {
        let obj = AV.Object.createWithoutData(classs, id);
        return await obj.destroy()
      },
      /**
       * 上传资源文件
       * @param {string} pat 文件路径
       */
      async upload(path) {
        return await new AV.File(path, {
          blob: {
            uri: path,
          },
        }).save()
      },
      /**
       * 登录
       */
      async login({ username, password }) {
        const user = await AV.User.logIn(username, password);
        return user
      },
      /**
       * 注册
       */
      async regist({ username, password }) {
        let user = new AV.User();
        user.set('username', username);
        user.set('password', password);
        user = await user.signUp();
        return user
      }
    };

    /* src/pages/login/index.svelte generated by Svelte v3.16.5 */
    const file$1 = "src/pages/login/index.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let updating_show;
    	let current;
    	let dispose;

    	function loading_show_binding(value) {
    		/*loading_show_binding*/ ctx[9].call(null, value);
    	}

    	let loading_props = {};

    	if (/*loading_show*/ ctx[2] !== void 0) {
    		loading_props.show = /*loading_show*/ ctx[2];
    	}

    	const loading = new Loading({ props: loading_props, $$inline: true });
    	binding_callbacks.push(() => bind(loading, "show", loading_show_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "林克";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "登录";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "注册";
    			t7 = space();
    			create_component(loading.$$.fragment);
    			attr_dev(h1, "class", "svelte-h03p5r");
    			add_location(h1, file$1, 84, 2, 1513);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "用户名");
    			input0.value = "kk";
    			attr_dev(input0, "class", "svelte-h03p5r");
    			add_location(input0, file$1, 86, 2, 1557);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "密码, 不少于6位");
    			input1.value = "aa123456";
    			attr_dev(input1, "class", "svelte-h03p5r");
    			add_location(input1, file$1, 87, 2, 1632);
    			attr_dev(button0, "class", "full svelte-h03p5r");
    			add_location(button0, file$1, 92, 2, 1739);
    			attr_dev(button1, "class", "full svelte-h03p5r");
    			add_location(button1, file$1, 93, 2, 1791);
    			attr_dev(div, "id", "login_page");
    			attr_dev(div, "class", "half svelte-h03p5r");
    			add_location(div, file$1, 83, 0, 1476);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    				listen_dev(button0, "click", /*login*/ ctx[3], false, false, false),
    				listen_dev(button1, "click", /*checkRegist*/ ctx[4], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(div, t2);
    			append_dev(div, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append_dev(div, t3);
    			append_dev(div, button0);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			insert_dev(target, t7, anchor);
    			mount_component(loading, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}

    			const loading_changes = {};

    			if (!updating_show && dirty & /*loading_show*/ 4) {
    				updating_show = true;
    				loading_changes.show = /*loading_show*/ ctx[2];
    				add_flush_callback(() => updating_show = false);
    			}

    			loading.$set(loading_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t7);
    			destroy_component(loading, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let username = "";
    	let password = "";
    	let md5_password = "";
    	let loading_show = false;

    	async function login() {
    		$$invalidate(2, loading_show = true);

    		try {
    			await av.login({ username, password: md5_password });
    			push("/main");
    		} catch(error) {
    			console.log(Object.keys(error));
    			alert(error.rawMessage);
    		}

    		$$invalidate(2, loading_show = false);
    	}

    	function checkRegist() {
    		if (!username || !password) {
    			alert(`请输入账密`);
    			return;
    		} else if (password.length < 6) {
    			alert(`密码不少于6位`);
    			return;
    		}

    		if (confirm(`注册账密为: ${username}, ${password}, 请确认`)) {
    			regist();
    		}
    	}

    	async function regist() {
    		$$invalidate(2, loading_show = true);

    		try {
    			await av.regist({ username, password: md5_password });
    			push("/main");
    		} catch(error) {
    			console.log(error);
    			alert(error.rawMessage);
    		}

    		$$invalidate(2, loading_show = false);
    	}

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	function loading_show_binding(value) {
    		loading_show = value;
    		$$invalidate(2, loading_show);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    		if ("md5_password" in $$props) md5_password = $$props.md5_password;
    		if ("loading_show" in $$props) $$invalidate(2, loading_show = $$props.loading_show);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*password*/ 2) {
    			 {
    				md5_password = md5(password);
    			}
    		}
    	};

    	return [
    		username,
    		password,
    		loading_show,
    		login,
    		checkRegist,
    		md5_password,
    		regist,
    		input0_input_handler,
    		input1_input_handler,
    		loading_show_binding
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/pages/main/index.svelte generated by Svelte v3.16.5 */
    const file$2 = "src/pages/main/index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[31] = i;
    	return child_ctx;
    }

    // (202:4) {#each list as item, idx (idx)}
    function create_each_block(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*item*/ ctx[29].get("username") + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*item*/ ctx[29].get("phone") + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*item*/ ctx[29].get("profession") + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*item*/ ctx[29].get("remind") + "";
    	let t6;
    	let t7;
    	let td4;
    	let button0;
    	let t9;
    	let button1;
    	let t11;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[21](/*item*/ ctx[29], /*idx*/ ctx[31], ...args);
    	}

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[22](/*item*/ ctx[29], /*idx*/ ctx[31], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			button0 = element("button");
    			button0.textContent = "编辑";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "删除";
    			t11 = space();
    			add_location(td0, file$2, 203, 8, 3779);
    			add_location(td1, file$2, 204, 8, 3819);
    			add_location(td2, file$2, 205, 8, 3856);
    			add_location(td3, file$2, 206, 8, 3898);
    			attr_dev(button0, "class", "small_btn");
    			add_location(button0, file$2, 208, 10, 3951);
    			attr_dev(button1, "class", "small_btn error svelte-1fwldnf");
    			add_location(button1, file$2, 211, 10, 4055);
    			add_location(td4, file$2, 207, 8, 3936);
    			add_location(tr, file$2, 202, 6, 3766);

    			dispose = [
    				listen_dev(
    					button0,
    					"click",
    					function () {
    						click_handler_1.apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				listen_dev(
    					button1,
    					"click",
    					function () {
    						click_handler_2.apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];

    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, button0);
    			append_dev(td4, t9);
    			append_dev(td4, button1);
    			append_dev(tr, t11);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*list*/ 2 && t0_value !== (t0_value = /*item*/ ctx[29].get("username") + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*list*/ 2 && t2_value !== (t2_value = /*item*/ ctx[29].get("phone") + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*list*/ 2 && t4_value !== (t4_value = /*item*/ ctx[29].get("profession") + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*list*/ 2 && t6_value !== (t6_value = /*item*/ ctx[29].get("remind") + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(202:4) {#each list as item, idx (idx)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let span;
    	let t4;
    	let t5;
    	let div0;
    	let input0;
    	let t6;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t8;
    	let th1;
    	let t10;
    	let th2;
    	let t12;
    	let th3;
    	let t14;
    	let th4;
    	let t16;
    	let tbody;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t17;
    	let div1;
    	let input1;
    	let t18;
    	let label0;
    	let t19;
    	let article;
    	let header;
    	let h3;
    	let t20_value = (/*is_edit*/ ctx[4] ? "编辑" : "新增") + "";
    	let t20;
    	let t21;
    	let label1;
    	let t23;
    	let section;
    	let input2;
    	let t24;
    	let input3;
    	let t25;
    	let input4;
    	let t26;
    	let input5;
    	let t27;
    	let footer;
    	let label2;
    	let t29;
    	let label3;
    	let t31;
    	let updating_show;
    	let current;
    	let dispose;
    	let each_value = /*list*/ ctx[1];
    	const get_key = ctx => /*idx*/ ctx[31];

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	function loading_show_binding(value) {
    		/*loading_show_binding*/ ctx[28].call(null, value);
    	}

    	let loading_props = {};

    	if (/*loading_show*/ ctx[0] !== void 0) {
    		loading_props.show = /*loading_show*/ ctx[0];
    	}

    	const loading = new Loading({ props: loading_props, $$inline: true });
    	binding_callbacks.push(() => bind(loading, "show", loading_show_binding));

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "新增";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "退出";
    			t3 = space();
    			span = element("span");
    			t4 = text(/*list_count_content*/ ctx[2]);
    			t5 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t6 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "姓名";
    			t8 = space();
    			th1 = element("th");
    			th1.textContent = "号码";
    			t10 = space();
    			th2 = element("th");
    			th2.textContent = "职业";
    			t12 = space();
    			th3 = element("th");
    			th3.textContent = "备注";
    			t14 = space();
    			th4 = element("th");
    			th4.textContent = "操作";
    			t16 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t17 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t18 = space();
    			label0 = element("label");
    			t19 = space();
    			article = element("article");
    			header = element("header");
    			h3 = element("h3");
    			t20 = text(t20_value);
    			t21 = space();
    			label1 = element("label");
    			label1.textContent = "×";
    			t23 = space();
    			section = element("section");
    			input2 = element("input");
    			t24 = space();
    			input3 = element("input");
    			t25 = space();
    			input4 = element("input");
    			t26 = space();
    			input5 = element("input");
    			t27 = space();
    			footer = element("footer");
    			label2 = element("label");
    			label2.textContent = "确定";
    			t29 = space();
    			label3 = element("label");
    			label3.textContent = "取消";
    			t31 = space();
    			create_component(loading.$$.fragment);
    			attr_dev(button0, "class", "button");
    			add_location(button0, file$2, 177, 2, 3210);
    			attr_dev(button1, "class", "warning");
    			add_location(button1, file$2, 178, 2, 3269);
    			attr_dev(span, "class", "list_count_content");
    			set_style(span, "margin-left", "100px");
    			add_location(span, file$2, 179, 2, 3325);
    			attr_dev(input0, "placeholder", "搜索");
    			add_location(input0, file$2, 183, 4, 3447);
    			attr_dev(div0, "class", "menu");
    			add_location(div0, file$2, 182, 2, 3424);
    			attr_dev(nav, "class", "svelte-1fwldnf");
    			add_location(nav, file$2, 176, 0, 3202);
    			add_location(th0, file$2, 193, 6, 3598);
    			add_location(th1, file$2, 194, 6, 3616);
    			add_location(th2, file$2, 195, 6, 3634);
    			add_location(th3, file$2, 196, 6, 3652);
    			add_location(th4, file$2, 197, 6, 3670);
    			add_location(tr, file$2, 192, 4, 3587);
    			add_location(thead, file$2, 191, 2, 3575);
    			attr_dev(tbody, "id", "tbody");
    			add_location(tbody, file$2, 200, 2, 3705);
    			attr_dev(table, "class", "svelte-1fwldnf");
    			add_location(table, file$2, 190, 0, 3565);
    			attr_dev(input1, "id", "modal_add");
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$2, 221, 2, 4235);
    			attr_dev(label0, "for", "modal_add");
    			attr_dev(label0, "class", "overlay");
    			add_location(label0, file$2, 222, 2, 4291);
    			add_location(h3, file$2, 225, 6, 4364);
    			attr_dev(label1, "for", "modal_add");
    			attr_dev(label1, "class", "close");
    			add_location(label1, file$2, 226, 6, 4403);
    			add_location(header, file$2, 224, 4, 4349);
    			attr_dev(input2, "class", "half svelte-1fwldnf");
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "姓名");
    			add_location(input2, file$2, 229, 6, 4522);
    			attr_dev(input3, "class", "half center svelte-1fwldnf");
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "placeholder", "号码");
    			add_location(input3, file$2, 234, 6, 4634);
    			attr_dev(input4, "class", "half svelte-1fwldnf");
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "placeholder", "职业");
    			add_location(input4, file$2, 239, 6, 4750);
    			attr_dev(input5, "class", "half svelte-1fwldnf");
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "placeholder", "备注");
    			add_location(input5, file$2, 244, 6, 4864);
    			attr_dev(section, "class", "content flex one center");
    			add_location(section, file$2, 228, 4, 4474);
    			attr_dev(label2, "class", "button");
    			add_location(label2, file$2, 247, 6, 4970);
    			attr_dev(label3, "for", "modal_add");
    			attr_dev(label3, "class", "button dangerous");
    			add_location(label3, file$2, 248, 6, 5032);
    			add_location(footer, file$2, 246, 4, 4955);
    			add_location(article, file$2, 223, 2, 4335);
    			attr_dev(div1, "class", "modal svelte-1fwldnf");
    			add_location(div1, file$2, 220, 0, 4213);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[19], false, false, false),
    				listen_dev(button1, "click", logout, false, false, false),
    				listen_dev(input0, "keypress", /*changeSearchInput*/ ctx[10], false, false, false),
    				listen_dev(input1, "change", /*input1_change_handler*/ ctx[23]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[24]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[25]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[26]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[27]),
    				listen_dev(label2, "click", /*confirmForm*/ ctx[11], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, button0);
    			append_dev(nav, t1);
    			append_dev(nav, button1);
    			append_dev(nav, t3);
    			append_dev(nav, span);
    			append_dev(span, t4);
    			append_dev(nav, t5);
    			append_dev(nav, div0);
    			append_dev(div0, input0);
    			/*input0_binding*/ ctx[20](input0);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t8);
    			append_dev(tr, th1);
    			append_dev(tr, t10);
    			append_dev(tr, th2);
    			append_dev(tr, t12);
    			append_dev(tr, th3);
    			append_dev(tr, t14);
    			append_dev(tr, th4);
    			append_dev(table, t16);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			insert_dev(target, t17, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input1);
    			input1.checked = /*checked*/ ctx[3];
    			append_dev(div1, t18);
    			append_dev(div1, label0);
    			append_dev(div1, t19);
    			append_dev(div1, article);
    			append_dev(article, header);
    			append_dev(header, h3);
    			append_dev(h3, t20);
    			append_dev(header, t21);
    			append_dev(header, label1);
    			append_dev(article, t23);
    			append_dev(article, section);
    			append_dev(section, input2);
    			set_input_value(input2, /*username*/ ctx[6]);
    			append_dev(section, t24);
    			append_dev(section, input3);
    			set_input_value(input3, /*phone*/ ctx[7]);
    			append_dev(section, t25);
    			append_dev(section, input4);
    			set_input_value(input4, /*profession*/ ctx[8]);
    			append_dev(section, t26);
    			append_dev(section, input5);
    			set_input_value(input5, /*remind*/ ctx[9]);
    			append_dev(article, t27);
    			append_dev(article, footer);
    			append_dev(footer, label2);
    			append_dev(footer, t29);
    			append_dev(footer, label3);
    			insert_dev(target, t31, anchor);
    			mount_component(loading, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*list_count_content*/ 4) set_data_dev(t4, /*list_count_content*/ ctx[2]);
    			const each_value = /*list*/ ctx[1];
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tbody, destroy_block, create_each_block, null, get_each_context);

    			if (dirty[0] & /*checked*/ 8) {
    				input1.checked = /*checked*/ ctx[3];
    			}

    			if ((!current || dirty[0] & /*is_edit*/ 16) && t20_value !== (t20_value = (/*is_edit*/ ctx[4] ? "编辑" : "新增") + "")) set_data_dev(t20, t20_value);

    			if (dirty[0] & /*username*/ 64 && input2.value !== /*username*/ ctx[6]) {
    				set_input_value(input2, /*username*/ ctx[6]);
    			}

    			if (dirty[0] & /*phone*/ 128 && input3.value !== /*phone*/ ctx[7]) {
    				set_input_value(input3, /*phone*/ ctx[7]);
    			}

    			if (dirty[0] & /*profession*/ 256 && input4.value !== /*profession*/ ctx[8]) {
    				set_input_value(input4, /*profession*/ ctx[8]);
    			}

    			if (dirty[0] & /*remind*/ 512 && input5.value !== /*remind*/ ctx[9]) {
    				set_input_value(input5, /*remind*/ ctx[9]);
    			}

    			const loading_changes = {};

    			if (!updating_show && dirty[0] & /*loading_show*/ 1) {
    				updating_show = true;
    				loading_changes.show = /*loading_show*/ ctx[0];
    				add_flush_callback(() => updating_show = false);
    			}

    			loading.$set(loading_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			/*input0_binding*/ ctx[20](null);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t31);
    			destroy_component(loading, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function logout() {
    	AV.User.logOut();
    	replace("/");
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let user = AV.User.current();

    	if (!user) {
    		replace("/");
    	}

    	let loading_show = false;
    	let list = [];
    	let list_count_content = "";
    	let checked = false;
    	let is_edit = false;
    	let edit_id = "";
    	let seach_input;
    	let username;
    	let phone;
    	let profession;
    	let remind;
    	getList();

    	async function getList(search_value = "") {
    		$$invalidate(0, loading_show = true);

    		try {
    			$$invalidate(1, list = (await av.read("Contact", q => {
    				q.equalTo("user", user);

    				if (search_value) {
    					q.contains("username", search_value);
    				}

    				q.limit(1000);
    			})).sort((a, b) => a.get("username").localeCompare(b.get("username"), "zh-Hans-CN", { sensitivity: "accent" })));

    			$$invalidate(2, list_count_content = `共${list.length}条`);
    		} catch(error) {
    			alert(error.rawMessage || error.message);
    		}

    		$$invalidate(0, loading_show = false);
    	}

    	function changeSearchInput(e) {
    		if (e.keyCode === 13) {
    			getList(e.target.value);
    		}
    	}

    	async function confirmForm() {
    		if (!username || !phone || !profession || !remind) {
    			alert("请输入全部内容");
    			return;
    		}

    		const body = {
    			username,
    			phone,
    			profession,
    			remind,
    			user
    		};

    		$$invalidate(0, loading_show = true);

    		try {
    			if (is_edit) {
    				await av.update("Contact", edit_id, body);
    				$$invalidate(3, checked = false);
    				alert("更新成功");
    				getList();
    			} else {
    				await av.create("Contact", body);
    				$$invalidate(3, checked = false);
    				alert("新增成功");
    				getList();
    			}

    			updateForm();
    		} catch(error) {
    			alert(error.rawMessage || error.message);
    		}

    		$$invalidate(0, loading_show = false);
    	}

    	function updateForm(json = {}) {
    		$$invalidate(6, username = json.username || "");
    		$$invalidate(7, phone = json.phone || "");
    		$$invalidate(8, profession = json.profession || "");
    		$$invalidate(9, remind = json.remind || "");
    	}

    	function add(item, idx) {
    		$$invalidate(3, checked = true);
    		$$invalidate(4, is_edit = false);
    		updateForm();
    	}

    	function edit(item, idx) {
    		$$invalidate(3, checked = true);
    		$$invalidate(4, is_edit = true);
    		edit_id = item.id;
    		updateForm(item.toJSON());
    	}

    	async function del(item, idx) {
    		if (confirm("确认删除吗?")) {
    			$$invalidate(0, loading_show = true);

    			try {
    				await av.delete("Contact", item.id);
    				$$invalidate(3, checked = false);
    				list.splice(idx, 1);
    				$$invalidate(1, list);
    			} catch(error) {
    				alert(error.rawMessage || error.message);
    			}

    			$$invalidate(0, loading_show = false);
    		}
    	}

    	const click_handler = e => add();

    	function input0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(5, seach_input = $$value);
    		});
    	}

    	const click_handler_1 = (item, idx, e) => edit(item);
    	const click_handler_2 = (item, idx, e) => del(item, idx);

    	function input1_change_handler() {
    		checked = this.checked;
    		$$invalidate(3, checked);
    	}

    	function input2_input_handler() {
    		username = this.value;
    		$$invalidate(6, username);
    	}

    	function input3_input_handler() {
    		phone = this.value;
    		$$invalidate(7, phone);
    	}

    	function input4_input_handler() {
    		profession = this.value;
    		$$invalidate(8, profession);
    	}

    	function input5_input_handler() {
    		remind = this.value;
    		$$invalidate(9, remind);
    	}

    	function loading_show_binding(value) {
    		loading_show = value;
    		$$invalidate(0, loading_show);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) user = $$props.user;
    		if ("loading_show" in $$props) $$invalidate(0, loading_show = $$props.loading_show);
    		if ("list" in $$props) $$invalidate(1, list = $$props.list);
    		if ("list_count_content" in $$props) $$invalidate(2, list_count_content = $$props.list_count_content);
    		if ("checked" in $$props) $$invalidate(3, checked = $$props.checked);
    		if ("is_edit" in $$props) $$invalidate(4, is_edit = $$props.is_edit);
    		if ("edit_id" in $$props) edit_id = $$props.edit_id;
    		if ("seach_input" in $$props) $$invalidate(5, seach_input = $$props.seach_input);
    		if ("username" in $$props) $$invalidate(6, username = $$props.username);
    		if ("phone" in $$props) $$invalidate(7, phone = $$props.phone);
    		if ("profession" in $$props) $$invalidate(8, profession = $$props.profession);
    		if ("remind" in $$props) $$invalidate(9, remind = $$props.remind);
    	};

    	return [
    		loading_show,
    		list,
    		list_count_content,
    		checked,
    		is_edit,
    		seach_input,
    		username,
    		phone,
    		profession,
    		remind,
    		changeSearchInput,
    		confirmForm,
    		add,
    		edit,
    		del,
    		edit_id,
    		user,
    		getList,
    		updateForm,
    		click_handler,
    		input0_binding,
    		click_handler_1,
    		click_handler_2,
    		input1_change_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		loading_show_binding
    	];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/not_found/index.svelte generated by Svelte v3.16.5 */

    const file$3 = "src/pages/not_found/index.svelte";

    function create_fragment$4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "404 page";
    			attr_dev(div, "id", "loading_page");
    			add_location(div, file$3, 8, 0, 60);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Not_found extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Not_found",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.5 */

    function create_fragment$5(ctx) {
    	let current;

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self) {
    	const routes = {
    		"/": Login,
    		"/main": Main,
    		"*": Not_found
    	};

    	onMount(() => {
    		if (AV.User.current()) {
    			push("/main");
    		}
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    if(!(AV.applicationId && (AV.applicationKey || AV.masterKey))) {
      AV.init({
        appId: 'h7yi7AWU813r5FbiKqXWo7zC-9Nh9j0Va',
        appKey: 'HBMgkORRWCCgmdvkthe81pQ3',
        serverURLs: "https://h7yi7awu.lc-cn-e1-shared.com",
      });
    }

    const app = new App({
      target: document.body,
      props: {
        // name: 'world'
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
