(function () {
  const sections = Array.from(document.querySelectorAll('section[data-toc]'));
  const track = document.getElementById('tocTrack');
  const panel = document.getElementById('tocPanel');

  sections.forEach((sec, i) => {
    const label = sec.dataset.toc;

    const dash = document.createElement('div');
    dash.className = 'toc-dash';
    dash.dataset.index = i;
    dash.addEventListener('click', () => scrollToSection(sec));
    track.appendChild(dash);

    const link = document.createElement('a');
    link.href = `#${sec.id}`;
    link.dataset.index = i;
    link.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span>${label}</span>`;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection(sec);
    });
    panel.appendChild(link);
  });

  function scrollToSection(sec) {
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setActive(index) {
    track.querySelectorAll('.toc-dash').forEach((d) =>
      d.classList.toggle('active', Number(d.dataset.index) === index)
    );
    panel.querySelectorAll('a').forEach((a) =>
      a.classList.toggle('active', Number(a.dataset.index) === index)
    );
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = sections.indexOf(entry.target);
          if (idx !== -1) setActive(idx);
        }
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );

  sections.forEach((sec) => observer.observe(sec));
  setActive(0);
})();

(function () {
  const viewport = document.getElementById('carouselViewport');
  if (!viewport) return;

  const panels = Array.from(viewport.querySelectorAll('.carousel-panel'));
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const countEl = document.getElementById('carouselCount');
  const total = panels.length;
  let index = 0;
  let scrollTimer = null;
  // True while a scroll was started by this script (button click, or the
  // JS-driven "snap" after a manual drag). The reactive scroll listener
  // below only acts once scrolling has fully settled (no 'scroll' events
  // for 140ms) and ignores settles it caused itself, so it can never race
  // an in-flight animation and flip the active card back — no CSS
  // scroll-snap is involved at all, this is the only thing moving scrollLeft.
  let programmatic = false;

  function render() {
    panels.forEach((p, i) => p.classList.toggle('active', i === index));
    countEl.textContent = `${index + 1} / ${total}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
  }

  function targetLeftFor(i) {
    const card = panels[i];
    return card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
  }

  function scrollToIndex(i, instant) {
    programmatic = true;
    viewport.scrollTo({ left: targetLeftFor(i), behavior: instant ? 'auto' : 'smooth' });
  }

  function goTo(i) {
    index = Math.max(0, Math.min(total - 1, i));
    render();
    scrollToIndex(index, false);
  }

  function closestIndexToCenter() {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    panels.forEach((p, i) => {
      const cardCenter = p.offsetLeft + p.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  viewport.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (programmatic) {
        // This settle is the end of our own scroll (button click or the
        // manual-drag snap below) — the index it was aimed at is already
        // correct, so just clear the flag and stop.
        programmatic = false;
        return;
      }
      // Scrolling settled without us having driven it — a manual drag/swipe.
      // Adopt whichever card is closest, then snap precisely to its center.
      const closest = closestIndexToCenter();
      index = closest;
      render();
      scrollToIndex(closest, false);
    }, 140);
  });

  requestAnimationFrame(() => {
    render();
    scrollToIndex(0, true);
  });
})();
