// Interactive Animation Controller (Lenis, GSAP, Custom Cursor)

document.addEventListener("DOMContentLoaded", () => {
    // 0. Calming Onboarding
    const onboardingOverlay = document.getElementById('onboardingOverlay');
    const onboardingText = document.getElementById('onboardingText');
    
    if (onboardingOverlay && onboardingText) {
        const tl = gsap.timeline();
        tl.to(onboardingText, { opacity: 1, y: -20, duration: 1.5, ease: "power2.out" })
          .to(onboardingText, { opacity: 0, duration: 1, delay: 1 })
          .to(onboardingOverlay, { opacity: 0, duration: 1.5, ease: "power2.inOut", onComplete: () => {
              onboardingOverlay.style.display = 'none';
          } });
    }

    // 1. Initialize Lenis (Smooth Scrolling)
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. Custom Cursor Physics
    const cursor = document.querySelector('.custom-cursor');
    if (cursor && !window.matchMedia("(max-width: 768px)").matches) {
        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth trailing effect
        const renderCursor = () => {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
            requestAnimationFrame(renderCursor);
        };
        requestAnimationFrame(renderCursor);

        // Hover states for interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .mood-tag, .history-item');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('active'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });
    }

    // 3. Magnetic Buttons
    const magneticElements = document.querySelectorAll('.magnetic-btn');
    magneticElements.forEach(elem => {
        elem.addEventListener('mousemove', (e) => {
            const rect = elem.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // GSAP tween for smooth magnetic pull
            gsap.to(elem, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.5,
                ease: "power2.out"
            });
        });

        elem.addEventListener('mouseleave', () => {
            // Reset position
            gsap.to(elem, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });

    // 4. GSAP Scroll Animations
    gsap.registerPlugin(ScrollTrigger);

    // Reveal elements sequentially as they scroll into view
    const revealElements = document.querySelectorAll('.gsap-reveal');
    revealElements.forEach(el => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
            },
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out"
        });
    });

    // Staggered reveals for lists or grids
    const staggerContainers = document.querySelectorAll('.gsap-stagger-container');
    staggerContainers.forEach(container => {
        const items = container.querySelectorAll('.gsap-reveal-stagger');
        gsap.to(items, {
            scrollTrigger: {
                trigger: container,
                start: "top 80%",
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out"
        });
    });

    // Parallax Stickers
    const parallaxElements = document.querySelectorAll('.parallax');
    parallaxElements.forEach(el => {
        const speed = el.getAttribute('data-speed') || 1;
        gsap.to(el, {
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: true
            },
            y: (i, target) => -ScrollTrigger.maxScroll(window) * target.dataset.speed * 0.1,
            ease: "none"
        });
    });
});
