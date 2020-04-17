
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
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
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
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
            block.m(node, next, lookup.has(block.key));
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
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
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
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
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
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
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

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.20.1 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
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
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (207:0) {#if componentParams}
    function create_if_block(ctx) {
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
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
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
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(207:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function wrap(route, userData, ...conditions) {
    	// Check if we don't have userData
    	if (userData && typeof userData == "function") {
    		conditions = conditions && conditions.length ? conditions : [];
    		conditions.unshift(userData);
    		userData = undefined;
    	}

    	// Parameter route and each item of conditions must be functions
    	if (!route || typeof route != "function") {
    		throw Error("Invalid parameter route");
    	}

    	if (conditions && conditions.length) {
    		for (let i = 0; i < conditions.length; i++) {
    			if (!conditions[i] || typeof conditions[i] != "function") {
    				throw Error("Invalid parameter conditions[" + i + "]");
    			}
    		}
    	}

    	// Returns an object that contains all the functions to execute too
    	const obj = { route, userData };

    	if (conditions && conditions.length) {
    		obj.conditions = conditions;
    	}

    	// The _sveltesparouter flag is to confirm the object was created by this router
    	Object.defineProperty(obj, "_sveltesparouter", { value: true });

    	return obj;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
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

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function pop() {
    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.history.back();
    	});
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    		try {
    			window.history.replaceState(undefined, undefined, dest);
    		} catch(e) {
    			// eslint-disable-next-line no-console
    			console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    		}

    		// The method above doesn't trigger the hashchange event, so let's do that manually
    		window.dispatchEvent(new Event("hashchange"));
    	});
    }

    function link(node) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	// Destination must start with '/'
    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to every href attribute
    	node.setAttribute("href", "#" + href);
    }

    function nextTickPromise(cb) {
    	return new Promise(resolve => {
    			setTimeout(
    				() => {
    					resolve(cb());
    				},
    				0
    			);
    		});
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
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

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
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

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		nextTickPromise,
    		createEventDispatcher,
    		regexparam,
    		routes,
    		prefix,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		dispatch,
    		dispatchNextTick,
    		$loc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
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

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    						// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		$loc,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
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

    /* src/components/loading/index.svelte generated by Svelte v3.20.1 */

    const file = "src/components/loading/index.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let svg;
    	let rect0;
    	let animate0;
    	let animate1;
    	let animate2;
    	let rect1;
    	let animate3;
    	let animate4;
    	let animate5;
    	let rect2;
    	let animate6;
    	let animate7;
    	let animate8;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			animate0 = svg_element("animate");
    			animate1 = svg_element("animate");
    			animate2 = svg_element("animate");
    			rect1 = svg_element("rect");
    			animate3 = svg_element("animate");
    			animate4 = svg_element("animate");
    			animate5 = svg_element("animate");
    			rect2 = svg_element("rect");
    			animate6 = svg_element("animate");
    			animate7 = svg_element("animate");
    			animate8 = svg_element("animate");
    			attr_dev(animate0, "attributeName", "opacity");
    			attr_dev(animate0, "attributeType", "XML");
    			attr_dev(animate0, "values", "0.2; 1; .2");
    			attr_dev(animate0, "begin", "0s");
    			attr_dev(animate0, "dur", "0.6s");
    			attr_dev(animate0, "repeatCount", "indefinite");
    			add_location(animate0, file, 37, 6, 787);
    			attr_dev(animate1, "attributeName", "height");
    			attr_dev(animate1, "attributeType", "XML");
    			attr_dev(animate1, "values", "10; 20; 10");
    			attr_dev(animate1, "begin", "0s");
    			attr_dev(animate1, "dur", "0.6s");
    			attr_dev(animate1, "repeatCount", "indefinite");
    			add_location(animate1, file, 44, 6, 964);
    			attr_dev(animate2, "attributeName", "y");
    			attr_dev(animate2, "attributeType", "XML");
    			attr_dev(animate2, "values", "10; 5; 10");
    			attr_dev(animate2, "begin", "0s");
    			attr_dev(animate2, "dur", "0.6s");
    			attr_dev(animate2, "repeatCount", "indefinite");
    			add_location(animate2, file, 51, 6, 1140);
    			attr_dev(rect0, "x", "0");
    			attr_dev(rect0, "y", "10");
    			attr_dev(rect0, "width", "4");
    			attr_dev(rect0, "height", "10");
    			attr_dev(rect0, "fill", "#333");
    			attr_dev(rect0, "opacity", "0.2");
    			attr_dev(rect0, "class", "svelte-1pqou73");
    			add_location(rect0, file, 36, 4, 713);
    			attr_dev(animate3, "attributeName", "opacity");
    			attr_dev(animate3, "attributeType", "XML");
    			attr_dev(animate3, "values", "0.2; 1; .2");
    			attr_dev(animate3, "begin", "0.15s");
    			attr_dev(animate3, "dur", "0.6s");
    			attr_dev(animate3, "repeatCount", "indefinite");
    			add_location(animate3, file, 60, 6, 1394);
    			attr_dev(animate4, "attributeName", "height");
    			attr_dev(animate4, "attributeType", "XML");
    			attr_dev(animate4, "values", "10; 20; 10");
    			attr_dev(animate4, "begin", "0.15s");
    			attr_dev(animate4, "dur", "0.6s");
    			attr_dev(animate4, "repeatCount", "indefinite");
    			add_location(animate4, file, 67, 6, 1574);
    			attr_dev(animate5, "attributeName", "y");
    			attr_dev(animate5, "attributeType", "XML");
    			attr_dev(animate5, "values", "10; 5; 10");
    			attr_dev(animate5, "begin", "0.15s");
    			attr_dev(animate5, "dur", "0.6s");
    			attr_dev(animate5, "repeatCount", "indefinite");
    			add_location(animate5, file, 74, 6, 1753);
    			attr_dev(rect1, "x", "8");
    			attr_dev(rect1, "y", "10");
    			attr_dev(rect1, "width", "4");
    			attr_dev(rect1, "height", "10");
    			attr_dev(rect1, "fill", "#333");
    			attr_dev(rect1, "opacity", "0.2");
    			attr_dev(rect1, "class", "svelte-1pqou73");
    			add_location(rect1, file, 59, 4, 1320);
    			attr_dev(animate6, "attributeName", "opacity");
    			attr_dev(animate6, "attributeType", "XML");
    			attr_dev(animate6, "values", "0.2; 1; .2");
    			attr_dev(animate6, "begin", "0.3s");
    			attr_dev(animate6, "dur", "0.6s");
    			attr_dev(animate6, "repeatCount", "indefinite");
    			add_location(animate6, file, 83, 6, 2011);
    			attr_dev(animate7, "attributeName", "height");
    			attr_dev(animate7, "attributeType", "XML");
    			attr_dev(animate7, "values", "10; 20; 10");
    			attr_dev(animate7, "begin", "0.3s");
    			attr_dev(animate7, "dur", "0.6s");
    			attr_dev(animate7, "repeatCount", "indefinite");
    			add_location(animate7, file, 90, 6, 2190);
    			attr_dev(animate8, "attributeName", "y");
    			attr_dev(animate8, "attributeType", "XML");
    			attr_dev(animate8, "values", "10; 5; 10");
    			attr_dev(animate8, "begin", "0.3s");
    			attr_dev(animate8, "dur", "0.6s");
    			attr_dev(animate8, "repeatCount", "indefinite");
    			add_location(animate8, file, 97, 6, 2368);
    			attr_dev(rect2, "x", "16");
    			attr_dev(rect2, "y", "10");
    			attr_dev(rect2, "width", "4");
    			attr_dev(rect2, "height", "10");
    			attr_dev(rect2, "fill", "#333");
    			attr_dev(rect2, "opacity", "0.2");
    			attr_dev(rect2, "class", "svelte-1pqou73");
    			add_location(rect2, file, 82, 4, 1936);
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "Layer_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "width", "24px");
    			attr_dev(svg, "height", "30px");
    			attr_dev(svg, "viewBox", "0 0 24 30");
    			set_style(svg, "enable-background", "new 0 0 50 50");
    			attr_dev(svg, "xml:space", "preserve");
    			attr_dev(svg, "class", "svelte-1pqou73");
    			add_location(svg, file, 24, 2, 429);
    			attr_dev(div, "id", "loading");
    			set_style(div, "display", /*show*/ ctx[0] ? "flex" : "none");
    			attr_dev(div, "class", "svelte-1pqou73");
    			add_location(div, file, 23, 0, 365);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, rect0);
    			append_dev(rect0, animate0);
    			append_dev(rect0, animate1);
    			append_dev(rect0, animate2);
    			append_dev(svg, rect1);
    			append_dev(rect1, animate3);
    			append_dev(rect1, animate4);
    			append_dev(rect1, animate5);
    			append_dev(svg, rect2);
    			append_dev(rect2, animate6);
    			append_dev(rect2, animate7);
    			append_dev(rect2, animate8);
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

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Loading", $$slots, []);

    	$$self.$set = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({ show });

    	$$self.$inject_state = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

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

    /* src/pages/login/index.svelte generated by Svelte v3.20.1 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$1 = "src/pages/login/index.svelte";

    function create_fragment$2(ctx) {
    	let div4;
    	let h1;
    	let t1;
    	let div3;
    	let div0;
    	let input0;
    	let t2;
    	let div1;
    	let input1;
    	let t3;
    	let div2;
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
    			div4 = element("div");
    			h1 = element("h1");
    			h1.textContent = "林克";
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t3 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "登录";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "注册";
    			t7 = space();
    			create_component(loading.$$.fragment);
    			attr_dev(h1, "class", "text-center");
    			set_style(h1, "margin-top", "200px");
    			add_location(h1, file$1, 78, 2, 1392);
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "用户名");
    			add_location(input0, file$1, 81, 6, 1531);
    			attr_dev(div0, "class", "col-8 offset-2 col-xl-4 offset-xl-4");
    			add_location(div0, file$1, 80, 4, 1475);
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "placeholder", "密码, 不少于6位");
    			add_location(input1, file$1, 88, 6, 1742);
    			attr_dev(div1, "class", "col-8 offset-2 col-xl-4 offset-xl-4");
    			set_style(div1, "margin-top", "8px");
    			add_location(div1, file$1, 87, 4, 1661);
    			attr_dev(button0, "class", "btn btn-primary col-4");
    			add_location(button0, file$1, 95, 6, 1967);
    			attr_dev(button1, "class", "btn btn-info col-4 offset-4");
    			add_location(button1, file$1, 96, 6, 2040);
    			attr_dev(div2, "class", "col-8 offset-2 col-xl-4 offset-xl-4 row");
    			set_style(div2, "margin-top", "8px");
    			add_location(div2, file$1, 94, 4, 1882);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$1, 79, 2, 1453);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$1, 77, 0, 1366);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h1);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t5);
    			append_dev(div2, button1);
    			insert_dev(target, t7, anchor);
    			mount_component(loading, target, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    				listen_dev(button0, "click", /*login*/ ctx[3], false, false, false),
    				listen_dev(button1, "click", /*checkRegist*/ ctx[4], false, false, false)
    			];
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
    			if (detaching) detach_dev(div4);
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

    	// md5加密密码
    	let md5_password = "";

    	let loading_show = false;

    	async function login() {
    		if (username.length < 2 || !md5_password) {
    			alert("请输入合法账密");
    			return;
    		}

    		$$invalidate(2, loading_show = true);

    		try {
    			// 登录
    			await av.login({ username, password: md5_password });

    			push("/main");
    		} catch(error) {
    			console.log(Object.keys(error));
    			alert(error.rawMessage);
    		}

    		$$invalidate(2, loading_show = false);
    	}

    	/**
     * 检测注册数据
     */
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

    	/**
     * 注册
     */
    	async function regist() {
    		$$invalidate(2, loading_show = true);

    		try {
    			// 注册
    			await av.regist({ username, password: md5_password });

    			push("/main");
    		} catch(error) {
    			console.log(error);
    			alert(error.rawMessage);
    		}

    		$$invalidate(2, loading_show = false);
    	}

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Login", $$slots, []);

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

    	$$self.$capture_state = () => ({
    		push,
    		pop,
    		replace,
    		Loading,
    		av,
    		username,
    		password,
    		md5_password,
    		loading_show,
    		login,
    		checkRegist,
    		regist
    	});

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    		if ("md5_password" in $$props) md5_password = $$props.md5_password;
    		if ("loading_show" in $$props) $$invalidate(2, loading_show = $$props.loading_show);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

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

    /* src/pages/main/index.svelte generated by Svelte v3.20.1 */
    const file$2 = "src/pages/main/index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    // (198:8) {#each list as item, idx (item.id)}
    function create_each_block(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*item*/ ctx[30].get("username") + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*item*/ ctx[30].get("phone") + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*item*/ ctx[30].get("profession") + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*item*/ ctx[30].get("remind") + "";
    	let t6;
    	let t7;
    	let td4;
    	let div;
    	let button0;
    	let t9;
    	let button1;
    	let t11;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[22](/*item*/ ctx[30], /*idx*/ ctx[32], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[23](/*item*/ ctx[30], /*idx*/ ctx[32], ...args);
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
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "编辑";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "删除";
    			t11 = space();
    			add_location(td0, file$2, 199, 12, 4178);
    			add_location(td1, file$2, 200, 12, 4222);
    			add_location(td2, file$2, 201, 12, 4263);
    			add_location(td3, file$2, 202, 12, 4309);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-primary");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#edit_modal");
    			add_location(button0, file$2, 205, 16, 4410);
    			attr_dev(button1, "class", "btn btn-danger");
    			add_location(button1, file$2, 213, 16, 4691);
    			attr_dev(div, "class", "btn-group");
    			add_location(div, file$2, 204, 14, 4370);
    			add_location(td4, file$2, 203, 12, 4351);
    			add_location(tr, file$2, 198, 10, 4161);
    			this.first = tr;
    		},
    		m: function mount(target, anchor, remount) {
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
    			append_dev(td4, div);
    			append_dev(div, button0);
    			append_dev(div, t9);
    			append_dev(div, button1);
    			append_dev(tr, t11);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", click_handler, false, false, false),
    				listen_dev(button1, "click", click_handler_1, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*list*/ 2 && t0_value !== (t0_value = /*item*/ ctx[30].get("username") + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*list*/ 2 && t2_value !== (t2_value = /*item*/ ctx[30].get("phone") + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*list*/ 2 && t4_value !== (t4_value = /*item*/ ctx[30].get("profession") + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*list*/ 2 && t6_value !== (t6_value = /*item*/ ctx[30].get("remind") + "")) set_data_dev(t6, t6_value);
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
    		source: "(198:8) {#each list as item, idx (item.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let span;
    	let t4;
    	let t5;
    	let input0;
    	let t6;
    	let button2;
    	let t8;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t10;
    	let th1;
    	let t12;
    	let th2;
    	let t14;
    	let th3;
    	let t16;
    	let th4;
    	let t18;
    	let tbody;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t19;
    	let div7;
    	let div6;
    	let div5;
    	let div2;
    	let h4;
    	let t20_value = (/*is_edit*/ ctx[3] ? "编辑" : "新增") + "";
    	let t20;
    	let t21;
    	let button3;
    	let t23;
    	let div3;
    	let input1;
    	let t24;
    	let input2;
    	let t25;
    	let input3;
    	let t26;
    	let input4;
    	let t27;
    	let div4;
    	let button4;
    	let t29;
    	let button5;
    	let t31;
    	let updating_show;
    	let current;
    	let dispose;
    	let each_value = /*list*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[30].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	function loading_show_binding(value) {
    		/*loading_show_binding*/ ctx[29].call(null, value);
    	}

    	let loading_props = {};

    	if (/*loading_show*/ ctx[0] !== void 0) {
    		loading_props.show = /*loading_show*/ ctx[0];
    	}

    	const loading = new Loading({ props: loading_props, $$inline: true });
    	binding_callbacks.push(() => bind(loading, "show", loading_show_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "新增";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "退出";
    			t3 = space();
    			span = element("span");
    			t4 = text(/*list_count_content*/ ctx[2]);
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "搜索";
    			t8 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "姓名";
    			t10 = space();
    			th1 = element("th");
    			th1.textContent = "号码";
    			t12 = space();
    			th2 = element("th");
    			th2.textContent = "职业";
    			t14 = space();
    			th3 = element("th");
    			th3.textContent = "备注";
    			t16 = space();
    			th4 = element("th");
    			th4.textContent = "操作";
    			t18 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t19 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div2 = element("div");
    			h4 = element("h4");
    			t20 = text(t20_value);
    			t21 = space();
    			button3 = element("button");
    			button3.textContent = "×";
    			t23 = space();
    			div3 = element("div");
    			input1 = element("input");
    			t24 = space();
    			input2 = element("input");
    			t25 = space();
    			input3 = element("input");
    			t26 = space();
    			input4 = element("input");
    			t27 = space();
    			div4 = element("div");
    			button4 = element("button");
    			button4.textContent = "确认";
    			t29 = space();
    			button5 = element("button");
    			button5.textContent = "关闭";
    			t31 = space();
    			create_component(loading.$$.fragment);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "col-1 btn btn-primary");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#edit_modal");
    			add_location(button0, file$2, 155, 4, 3165);
    			attr_dev(button1, "class", "col-1 btn btn-warning");
    			set_style(button1, "margin-left", "8px");
    			add_location(button1, file$2, 163, 4, 3339);
    			attr_dev(span, "class", "col-2 row justify-content-center align-items-center");
    			add_location(span, file$2, 169, 4, 3467);
    			attr_dev(input0, "class", "col-2 form-control");
    			attr_dev(input0, "placeholder", "搜索内容");
    			add_location(input0, file$2, 172, 4, 3577);
    			attr_dev(button2, "class", "col-1 btn btn-primary");
    			set_style(button2, "margin-left", "8px");
    			add_location(button2, file$2, 177, 4, 3717);
    			attr_dev(div0, "class", "row my-1");
    			add_location(div0, file$2, 154, 2, 3138);
    			add_location(th0, file$2, 189, 10, 3953);
    			add_location(th1, file$2, 190, 10, 3975);
    			add_location(th2, file$2, 191, 10, 3997);
    			add_location(th3, file$2, 192, 10, 4019);
    			add_location(th4, file$2, 193, 10, 4041);
    			add_location(tr, file$2, 188, 8, 3938);
    			add_location(thead, file$2, 187, 6, 3922);
    			attr_dev(tbody, "id", "tbody");
    			add_location(tbody, file$2, 196, 6, 4088);
    			attr_dev(table, "class", "table table-striped");
    			add_location(table, file$2, 186, 4, 3880);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$2, 185, 2, 3858);
    			attr_dev(main, "class", "container-fluid");
    			add_location(main, file$2, 153, 0, 3105);
    			attr_dev(h4, "class", "modal-title");
    			add_location(h4, file$2, 231, 8, 5095);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "close");
    			attr_dev(button3, "data-dismiss", "modal");
    			add_location(button3, file$2, 232, 8, 5156);
    			attr_dev(div2, "class", "modal-header");
    			add_location(div2, file$2, 230, 6, 5060);
    			attr_dev(input1, "class", "form-control col-8 offset-2");
    			set_style(input1, "margin-top", "8px");
    			attr_dev(input1, "placeholder", "姓名");
    			add_location(input1, file$2, 239, 8, 5328);
    			attr_dev(input2, "class", "form-control col-8 offset-2");
    			set_style(input2, "margin-top", "8px");
    			attr_dev(input2, "placeholder", "号码");
    			add_location(input2, file$2, 244, 8, 5486);
    			attr_dev(input3, "class", "form-control col-8 offset-2");
    			set_style(input3, "margin-top", "8px");
    			attr_dev(input3, "placeholder", "职业");
    			add_location(input3, file$2, 249, 8, 5641);
    			attr_dev(input4, "class", "form-control col-8 offset-2");
    			set_style(input4, "margin-top", "8px");
    			attr_dev(input4, "placeholder", "备注");
    			add_location(input4, file$2, 254, 8, 5801);
    			attr_dev(div3, "class", "modal-body row");
    			add_location(div3, file$2, 238, 6, 5291);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-primary");
    			add_location(button4, file$2, 263, 8, 6025);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "btn btn-secondary");
    			attr_dev(button5, "data-dismiss", "modal");
    			add_location(button5, file$2, 269, 8, 6173);
    			attr_dev(div4, "class", "modal-footer");
    			add_location(div4, file$2, 262, 6, 5990);
    			attr_dev(div5, "class", "modal-content");
    			add_location(div5, file$2, 228, 4, 5005);
    			attr_dev(div6, "class", "modal-dialog");
    			add_location(div6, file$2, 227, 2, 4974);
    			attr_dev(div7, "class", "modal fade");
    			attr_dev(div7, "id", "edit_modal");
    			add_location(div7, file$2, 226, 0, 4931);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			append_dev(div0, t3);
    			append_dev(div0, span);
    			append_dev(span, t4);
    			append_dev(div0, t5);
    			append_dev(div0, input0);
    			/*input0_binding*/ ctx[21](input0);
    			append_dev(div0, t6);
    			append_dev(div0, button2);
    			append_dev(main, t8);
    			append_dev(main, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t10);
    			append_dev(tr, th1);
    			append_dev(tr, t12);
    			append_dev(tr, th2);
    			append_dev(tr, t14);
    			append_dev(tr, th3);
    			append_dev(tr, t16);
    			append_dev(tr, th4);
    			append_dev(table, t18);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			insert_dev(target, t19, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, h4);
    			append_dev(h4, t20);
    			append_dev(div2, t21);
    			append_dev(div2, button3);
    			append_dev(div5, t23);
    			append_dev(div5, div3);
    			append_dev(div3, input1);
    			set_input_value(input1, /*username*/ ctx[5]);
    			append_dev(div3, t24);
    			append_dev(div3, input2);
    			set_input_value(input2, /*phone*/ ctx[6]);
    			append_dev(div3, t25);
    			append_dev(div3, input3);
    			set_input_value(input3, /*profession*/ ctx[7]);
    			append_dev(div3, t26);
    			append_dev(div3, input4);
    			set_input_value(input4, /*remind*/ ctx[8]);
    			append_dev(div5, t27);
    			append_dev(div5, div4);
    			append_dev(div4, button4);
    			append_dev(div4, t29);
    			append_dev(div4, button5);
    			/*button5_binding*/ ctx[28](button5);
    			insert_dev(target, t31, anchor);
    			mount_component(loading, target, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*preAdd*/ ctx[12], false, false, false),
    				listen_dev(button1, "click", logout, false, false, false),
    				listen_dev(input0, "keypress", /*changeSearchInput*/ ctx[10], false, false, false),
    				listen_dev(button2, "click", /*clickSearch*/ ctx[11], false, false, false),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[24]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[25]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[26]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[27]),
    				listen_dev(
    					button4,
    					"click",
    					function () {
    						if (is_function(/*is_edit*/ ctx[3] ? /*edit*/ ctx[15] : /*add*/ ctx[13])) (/*is_edit*/ ctx[3] ? /*edit*/ ctx[15] : /*add*/ ctx[13]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (!current || dirty[0] & /*list_count_content*/ 4) set_data_dev(t4, /*list_count_content*/ ctx[2]);

    			if (dirty[0] & /*del, list, preEdit*/ 81922) {
    				const each_value = /*list*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tbody, destroy_block, create_each_block, null, get_each_context);
    			}

    			if ((!current || dirty[0] & /*is_edit*/ 8) && t20_value !== (t20_value = (/*is_edit*/ ctx[3] ? "编辑" : "新增") + "")) set_data_dev(t20, t20_value);

    			if (dirty[0] & /*username*/ 32 && input1.value !== /*username*/ ctx[5]) {
    				set_input_value(input1, /*username*/ ctx[5]);
    			}

    			if (dirty[0] & /*phone*/ 64 && input2.value !== /*phone*/ ctx[6]) {
    				set_input_value(input2, /*phone*/ ctx[6]);
    			}

    			if (dirty[0] & /*profession*/ 128 && input3.value !== /*profession*/ ctx[7]) {
    				set_input_value(input3, /*profession*/ ctx[7]);
    			}

    			if (dirty[0] & /*remind*/ 256 && input4.value !== /*remind*/ ctx[8]) {
    				set_input_value(input4, /*remind*/ ctx[8]);
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
    			if (detaching) detach_dev(main);
    			/*input0_binding*/ ctx[21](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div7);
    			/*button5_binding*/ ctx[28](null);
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

    	let loading_show = false,
    		// 条目统计
    		list = [],
    		list_count_content = "",
    		// 表单显示控制
    		checked = false,
    		// 是否为编辑
    		is_edit = false,
    		// 当前编辑的objectId
    		edit_id = "",
    		// 搜索框实例
    		seach_input,
    		// 表单字段
    		username,
    		phone,
    		profession,
    		remind,
    		btn_modal_close;

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
    			// 回车
    			getList(e.target.value);
    		}
    	}

    	function clickSearch() {
    		getList(seach_input.value);
    	}

    	function preAdd(item, idx) {
    		$$invalidate(3, is_edit = false);
    		$$invalidate(5, username = "");
    		$$invalidate(6, phone = "");
    		$$invalidate(7, profession = "");
    		$$invalidate(8, remind = "");
    		edit_id = "";
    	}

    	async function add(item, idx) {
    		$$invalidate(3, is_edit = false);

    		const body = {
    			username,
    			phone,
    			profession,
    			remind,
    			user
    		};

    		try {
    			// 新增
    			await av.create("Contact", body);

    			checked = false;

    			jQuery.toast({
    				title: "新增成功",
    				type: "success",
    				delay: 1500
    			});

    			getList();
    			btn_modal_close.click();
    		} catch(error) {
    			alert(error.rawMessage || error.message);
    		}
    	}

    	function preEdit(item, idx) {
    		$$invalidate(3, is_edit = true);
    		const json = item.toJSON();
    		$$invalidate(5, username = json.username);
    		$$invalidate(6, phone = json.phone);
    		$$invalidate(7, profession = json.profession);
    		$$invalidate(8, remind = json.remind);
    		edit_id = json.objectId;
    	}

    	async function edit(item, idx) {
    		const body = { username, phone, profession, remind };

    		try {
    			await av.update("Contact", edit_id, body);
    			checked = false;

    			jQuery.toast({
    				title: "更新成功",
    				type: "success",
    				delay: 1500
    			});

    			getList();
    			btn_modal_close.click();
    		} catch(error) {
    			alert(error.rawMessage || error.message);
    		}
    	}

    	async function del(item, idx) {
    		if (confirm("确认删除吗?")) {
    			$$invalidate(0, loading_show = true);

    			try {
    				await av.delete("Contact", item.id);
    				checked = false;
    				list.splice(idx, 1);
    				$$invalidate(1, list);
    			} catch(error) {
    				alert(error.rawMessage || error.message);
    			}

    			$$invalidate(0, loading_show = false);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Main", $$slots, []);

    	function input0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, seach_input = $$value);
    		});
    	}

    	const click_handler = (item, idx, e) => preEdit(item);
    	const click_handler_1 = (item, idx, e) => del(item, idx);

    	function input1_input_handler() {
    		username = this.value;
    		$$invalidate(5, username);
    	}

    	function input2_input_handler() {
    		phone = this.value;
    		$$invalidate(6, phone);
    	}

    	function input3_input_handler() {
    		profession = this.value;
    		$$invalidate(7, profession);
    	}

    	function input4_input_handler() {
    		remind = this.value;
    		$$invalidate(8, remind);
    	}

    	function button5_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(9, btn_modal_close = $$value);
    		});
    	}

    	function loading_show_binding(value) {
    		loading_show = value;
    		$$invalidate(0, loading_show);
    	}

    	$$self.$capture_state = () => ({
    		push,
    		pop,
    		replace,
    		Loading,
    		av,
    		user,
    		loading_show,
    		list,
    		list_count_content,
    		checked,
    		is_edit,
    		edit_id,
    		seach_input,
    		username,
    		phone,
    		profession,
    		remind,
    		btn_modal_close,
    		getList,
    		changeSearchInput,
    		clickSearch,
    		logout,
    		preAdd,
    		add,
    		preEdit,
    		edit,
    		del
    	});

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) user = $$props.user;
    		if ("loading_show" in $$props) $$invalidate(0, loading_show = $$props.loading_show);
    		if ("list" in $$props) $$invalidate(1, list = $$props.list);
    		if ("list_count_content" in $$props) $$invalidate(2, list_count_content = $$props.list_count_content);
    		if ("checked" in $$props) checked = $$props.checked;
    		if ("is_edit" in $$props) $$invalidate(3, is_edit = $$props.is_edit);
    		if ("edit_id" in $$props) edit_id = $$props.edit_id;
    		if ("seach_input" in $$props) $$invalidate(4, seach_input = $$props.seach_input);
    		if ("username" in $$props) $$invalidate(5, username = $$props.username);
    		if ("phone" in $$props) $$invalidate(6, phone = $$props.phone);
    		if ("profession" in $$props) $$invalidate(7, profession = $$props.profession);
    		if ("remind" in $$props) $$invalidate(8, remind = $$props.remind);
    		if ("btn_modal_close" in $$props) $$invalidate(9, btn_modal_close = $$props.btn_modal_close);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		loading_show,
    		list,
    		list_count_content,
    		is_edit,
    		seach_input,
    		username,
    		phone,
    		profession,
    		remind,
    		btn_modal_close,
    		changeSearchInput,
    		clickSearch,
    		preAdd,
    		add,
    		preEdit,
    		edit,
    		del,
    		checked,
    		edit_id,
    		user,
    		getList,
    		input0_binding,
    		click_handler,
    		click_handler_1,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		button5_binding,
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

    /* src/pages/not_found/index.svelte generated by Svelte v3.20.1 */

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

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Not_found> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Not_found", $$slots, []);
    	return [];
    }

    class Not_found extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Not_found",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.20.1 */

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

    function instance$5($$self, $$props, $$invalidate) {
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		onMount,
    		Router,
    		push,
    		LoginPage: Login,
    		MainPage: Main,
    		NotFound: Not_found,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

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
