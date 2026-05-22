// ===== PREMIUM VISUAL ENHANCEMENTS =====

(function() {
    'use strict';

    // ===== Particle System =====
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouseX = 0;
        let mouseY = 0;
        let width, height;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.4;
                this.opacity = Math.random() * 0.6 + 0.15;
                this.opacityDir = Math.random() > 0.5 ? 1 : -1;
                this.hue = Math.random() > 0.7 ? 42 : (Math.random() > 0.5 ? 280 : 175);
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                this.opacity += this.opacityDir * 0.003;
                if (this.opacity > 0.6) this.opacityDir = -1;
                if (this.opacity < 0.05) this.opacityDir = 1;

                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    this.x -= dx * force * 0.008;
                    this.y -= dy * force * 0.008;
                }

                if (this.x < -10) this.x = width + 10;
                if (this.x > width + 10) this.x = -10;
                if (this.y < -10) this.y = height + 10;
                if (this.y > height + 10) this.y = -10;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, ${this.opacity})`;
                ctx.fill();
            }
        }

        function initParticles() {
            const count = Math.min(Math.floor((width * height) / 8000), 150);
            particles = [];
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }

        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 140) {
                        const opacity = (1 - dist / 140) * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(240, 192, 64, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            drawConnections();
            requestAnimationFrame(animate);
        }

        resize();
        initParticles();
        animate();

        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
    }

    // ===== Scroll Reveal =====
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.movie-card, .trending-item, .filter-btn, .stat-item, .footer-section, .content-section');
        
        if (!revealElements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, index * 50);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }

    // Use MutationObserver to apply reveals to dynamically loaded content
    const gridObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && (node.classList?.contains('movie-card') || node.classList?.contains('trending-item'))) {
                    node.classList.add('reveal');
                    setTimeout(() => node.classList.add('revealed'), 100);
                }
            });
        });
    });

    const moviesGrid = document.getElementById('movies-grid');
    if (moviesGrid) {
        gridObserver.observe(moviesGrid, { childList: true });
    }

    const trendingTrack = document.getElementById('trending-track');
    if (trendingTrack) {
        gridObserver.observe(trendingTrack, { childList: true });
    }

    // ===== Navbar Scroll Effect =====
    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    navbar.classList.toggle('scrolled', window.scrollY > 50);
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ===== Smooth Card Tilt on Hover =====
    function initCardTilt() {
        document.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.movie-card:hover');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / centerY * -3;
                const rotateY = (x - centerX) / centerX * 3;
                card.style.transform = `translateY(-12px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
        });

        document.addEventListener('mouseleave', (e) => {
            if (e.target.classList?.contains('movie-card')) {
                e.target.style.transform = '';
            }
        }, true);
    }

    // ===== Back to Top Button =====
    function initBackToTop() {
        const fab = document.getElementById('back-to-top');
        if (!fab) return;

        window.addEventListener('scroll', () => {
            fab.classList.toggle('visible', window.scrollY > 400);
        });

        fab.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Initialize All =====
    document.addEventListener('DOMContentLoaded', () => {
        initScrollReveal();
        initNavbarScroll();
        initCardTilt();
        initBackToTop();
    });

    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
})();
