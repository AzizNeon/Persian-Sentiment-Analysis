(() => {
    "use strict";

    const STATE_KEY =
        "__sentipersNavigationState";

    const SCROLL_DURATION = 1500;
    const TOP_OFFSET = 24;

    const previousState =
        window[STATE_KEY];

    if (previousState?.clickHandler) {
        document.removeEventListener(
            "click",
            previousState.clickHandler,
            true
        );
    }

    if (previousState?.animationFrame) {
        window.cancelAnimationFrame(
            previousState.animationFrame
        );
    }

    const state = {
        animationFrame: null,
        clickHandler: null,
    };

    window[STATE_KEY] = state;

    const easeInOutCubic = (progress) => {
        if (progress < 0.5) {
            return 4 * progress ** 3;
        }

        return (
            1 -
            ((-2 * progress + 2) ** 3) / 2
        );
    };

    const getNotebookScroller = () => {
        return (
            document.querySelector(
                ".jp-WindowedPanel-outer"
            ) ||
            document.querySelector(
                ".jp-NotebookPanel-notebook"
            ) ||
            document.querySelector(
                "#notebook-container"
            ) ||
            document.querySelector(
                ".notebook-container"
            ) ||
            document.scrollingElement ||
            document.documentElement
        );
    };

    const isPageScroller = (
        scrollContainer
    ) => {
        return (
            scrollContainer ===
                document.scrollingElement ||
            scrollContainer ===
                document.documentElement ||
            scrollContainer ===
                document.body
        );
    };

    const getScrollPosition = (
        scrollContainer
    ) => {
        if (
            isPageScroller(
                scrollContainer
            )
        ) {
            return (
                window.scrollY ||
                document.documentElement
                    .scrollTop ||
                document.body.scrollTop ||
                0
            );
        }

        return scrollContainer.scrollTop;
    };

    const setScrollPosition = (
        scrollContainer,
        position
    ) => {
        if (
            isPageScroller(
                scrollContainer
            )
        ) {
            window.scrollTo(
                0,
                position
            );

            return;
        }

        scrollContainer.scrollTop =
            position;
    };

    const getMaximumScroll = (
        scrollContainer
    ) => {
        if (
            isPageScroller(
                scrollContainer
            )
        ) {
            const pageHeight = Math.max(
                document.documentElement
                    .scrollHeight,
                document.body.scrollHeight
            );

            return Math.max(
                pageHeight -
                    window.innerHeight,
                0
            );
        }

        return Math.max(
            scrollContainer.scrollHeight -
                scrollContainer.clientHeight,
            0
        );
    };

    const getTargetPosition = (
        scrollContainer,
        targetElement
    ) => {
        const startPosition =
            getScrollPosition(
                scrollContainer
            );

        const targetRect =
            targetElement
                .getBoundingClientRect();

        let destination;

        if (
            isPageScroller(
                scrollContainer
            )
        ) {
            destination =
                startPosition +
                targetRect.top -
                TOP_OFFSET;
        } else {
            const containerRect =
                scrollContainer
                    .getBoundingClientRect();

            destination =
                startPosition +
                targetRect.top -
                containerRect.top -
                TOP_OFFSET;
        }

        const maximumScroll =
            getMaximumScroll(
                scrollContainer
            );

        return Math.min(
            Math.max(
                destination,
                0
            ),
            maximumScroll
        );
    };

    const animateScroll = (
        scrollContainer,
        targetElement
    ) => {
        if (
            state.animationFrame !== null
        ) {
            window.cancelAnimationFrame(
                state.animationFrame
            );

            state.animationFrame = null;
        }

        scrollContainer.style.scrollBehavior =
            "auto";

        const startPosition =
            getScrollPosition(
                scrollContainer
            );

        const destination =
            getTargetPosition(
                scrollContainer,
                targetElement
            );

        const distance =
            destination - startPosition;

        if (Math.abs(distance) < 1) {
            setScrollPosition(
                scrollContainer,
                destination
            );

            return;
        }

        let startTime = null;

        const animationStep = (
            currentTime
        ) => {
            if (startTime === null) {
                startTime = currentTime;
            }

            const elapsedTime =
                currentTime - startTime;

            const progress = Math.min(
                elapsedTime /
                    SCROLL_DURATION,
                1
            );

            const easedProgress =
                easeInOutCubic(
                    progress
                );

            const currentPosition =
                startPosition +
                distance * easedProgress;

            setScrollPosition(
                scrollContainer,
                currentPosition
            );

            if (progress < 1) {
                state.animationFrame =
                    window.requestAnimationFrame(
                        animationStep
                    );

                return;
            }

            setScrollPosition(
                scrollContainer,
                destination
            );

            state.animationFrame = null;
        };

        state.animationFrame =
            window.requestAnimationFrame(
                animationStep
            );
    };

    const clickHandler = (event) => {
        const eventTarget =
            event.target instanceof Element
                ? event.target
                : null;

        if (!eventTarget) {
            return;
        }

        const link =
            eventTarget.closest(
                "a.smooth-scroll-link"
            );

        if (!link) {
            return;
        }

        const href =
            link.getAttribute("href");

        if (
            !href ||
            !href.startsWith("#")
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const targetId =
            decodeURIComponent(
                href.slice(1)
            );

        const targetElement =
            document.getElementById(
                targetId
            );

        if (!targetElement) {
            console.warn(
                `Navigation target not found: ${targetId}`
            );

            return;
        }

        const scrollContainer =
            getNotebookScroller();

        if (!scrollContainer) {
            console.warn(
                "Notebook scroll container was not found."
            );

            return;
        }

        console.info(
            "SentiPers navigation:",
            {
                targetId,
                scrollContainer,
                currentScroll:
                    getScrollPosition(
                        scrollContainer
                    ),
                destination:
                    getTargetPosition(
                        scrollContainer,
                        targetElement
                    ),
            }
        );

        animateScroll(
            scrollContainer,
            targetElement
        );

        window.history.replaceState(
            null,
            "",
            `#${encodeURIComponent(
                targetId
            )}`
        );
    };

    state.clickHandler =
        clickHandler;

    document.addEventListener(
        "click",
        clickHandler,
        true
    );

    document.documentElement.dataset
        .sentipersNavigation = "ready";

    console.info(
        "SentiPers smooth navigation is active."
    );
})();