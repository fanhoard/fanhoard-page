// Path:    assets/js/loading-system/fvl-modules/types.js
// Purpose: JSDoc typedefs for FVL (FanHoardVerse Loader) system.

/**
 * Display mode for the loader.
 * @typedef {'fullscreen'|'scoped'|'inline'|'topbar'} FVLMode
 */

/**
 * Visualization type. Currently only 'ring' is supported — kept as enum for
 * future expansion without breaking API.
 * @typedef {'ring'} FVLVisual
 */

/**
 * Options for FVL.show().
 * All properties are optional — sensible defaults apply per mode.
 *
 * @typedef {Object|string} FVLOptions
 * @property {FVLMode}    [mode='fullscreen']  - Display mode.
 * @property {string}     [id]                 - Unique ID. Auto-generated if omitted.
 * @property {string}     [group]              - Group name — only one loader per group
 *                                                open at a time. Opening new in same
 *                                                group hides the old one.
 * @property {string|HTMLElement} [target]     - CSS selector or element. Required for
 *                                                'scoped' and 'inline' modes. The
 *                                                container/button to attach to.
 * @property {string}     [message]            - Loading message text. For fullscreen,
 *                                                shows below spinner. For inline,
 *                                                shows after spinner inside target.
 *                                                Ignored for topbar.
 * @property {string}     [subMessage]         - Secondary message (fullscreen only).
 *                                                Defaults to English translation of
 *                                                `message` when active lang !== 'en'.
 * @property {string}     [lang]               - Language code ('en'|'th'|...).
 *                                                Auto-detected from localStorage.selectedLang
 *                                                if omitted.
 * @property {FVLVisual}  [visual='ring']      - Spinner visualization.
 * @property {number}     [size]               - Spinner size in px. Auto-sized per mode
 *                                                if omitted (fullscreen=68, scoped=40,
 *                                                inline=18, topbar=N/A).
 * @property {string}     [theme='light']      - 'light' | 'dark' | 'brand' | 'auto'.
 *                                                'auto' picks based on target bg color
 *                                                (scoped/inline only).
 * @property {number}     [progress]           - [topbar] 0..1 progress. omit = indeterminate.
 * @property {boolean}    [overlay=true]       - [scoped] Show semi-transparent backdrop.
 * @property {boolean}    [lockScroll=false]   - [fullscreen] Lock page scroll while shown.
 * @property {number}     [zIndex]             - Override z-index.
 * @property {number}     [autoHideAfterMs]    - Auto-hide after N ms (0 = manual).
 * @property {boolean}    [replaceContent=false] - [inline] Replace target's content
 *                                                entirely with spinner+message.
 *                                                Default = prepend (keep original visible).
 * @property {boolean}    [persistent=false]   - Cannot be dismissed via API shortcuts
 *                                                (must use handle.hide()).
 * @property {boolean}    [instant=false]      - Skip enter animation — overlay becomes
 *                                                visible immediately (opacity: 1) without
 *                                                the double-rAF fade-in. Use when the overlay
 *                                                must hide content changes happening in the
 *                                                same frame (prevents race conditions).
 * @property {boolean}    [coverAll=false]     - [fullscreen] Override top to 0 so the
 *                                                overlay covers the ENTIRE viewport including
 *                                                the header. Used for initial page load where
 *                                                the user should not see any unready UI.
 *                                                The fvl-nav-mode bottom/left rules still apply.
 * @property {Function}   [onShow]             - (id, handle) => void — after enter animation.
 * @property {Function}   [onHide]             - (id) => void — after exit animation.
 * @property {Function}   [onMount]            - (rootEl, handle) => void — DOM ready, pre-animation.
 */

/**
 * Handle returned by FVL.show(). Used to control a single loader instance.
 *
 * @typedef {Object} FVLHandle
 * @property {string}      id          - Unique instance ID.
 * @property {FVLMode}     mode        - Resolved display mode.
 * @property {FVLOptions}  options     - Resolved options.
 * @property {HTMLElement} element     - Root DOM element.
 * @property {Function}    hide        - () => Promise<void> — hide this loader.
 * @property {Function}    update      - (newOpts) => void — merge new options.
 * @property {Function}    setMessage  - (string|null) => void — update message.
 * @property {Function}    setProgress - (0..1|null) => void — update progress (topbar).
 * @property {Function}    getState    - () => 'showing'|'shown'|'hiding'|'hidden'.
 * @property {Function}    on          - (event, fn) => unsub — instance events.
 */

/**
 * Internal loader instance.
 * @typedef {Object} FVLInstance
 * @property {string}      id
 * @property {FVLMode}     mode
 * @property {FVLOptions}  options
 * @property {HTMLElement} rootEl
 * @property {HTMLElement} [spinnerEl]
 * @property {HTMLElement} [msgEl]
 * @property {HTMLElement} [subEl]
 * @property {HTMLElement} [barEl]
 * @property {HTMLElement} [targetEl]
 * @property {string}      state         - 'showing'|'shown'|'hiding'|'hidden'|'destroyed'
 * @property {number}      shownAt
 * @property {number|null} autoHideTimer
 * @property {number|null} rafId
 * @property {number|null} leaveTimer
 * @property {string}      origTargetPos - saved target.position for scoped mode
 * @property {string}      origTargetHTML - saved target.innerHTML for inline-replace mode
 * @property {Set<Function>} listeners
 */
