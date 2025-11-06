// app.js — FINAL VERSION
// Dark mode + category chips + login/signup protection + delete/unaccept
(function(){
  const LS_KEY = 'localworkhub_jobs_v1';
  const LS_ACCEPTED_KEY = 'localworkhub_accepted_v1';

  function sampleJobs(){
    return [
      {
        id: 'j1',
        title: 'Apartment Deep Cleaning',
        category: 'Cleaning',
        pay: 1200,
        location: 'Powai, Mumbai',
        description: '2-bedroom apartment deep cleaning. Bring your own supplies.',
        contact: 'cleaner@example.com',
        postedAt: Date.now() - 1000 * 60 * 60 * 24
      },
      {
        id: 'j2',
        title: 'Math Tutor (Class 8)',
        category: 'Tutoring',
        pay: 500,
        location: 'Andheri West, Mumbai',
        description: '1 hour session, twice a week. Focus on algebra & geometry.',
        contact: 'tutor@example.com',
        postedAt: Date.now() - 1000 * 60 * 60 * 4
      }
    ];
  }

  function loadJobs(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : sampleJobs();
    }catch(e){ return sampleJobs(); }
  }
  function saveJobs(jobs){
    localStorage.setItem(LS_KEY, JSON.stringify(jobs));
  }
  function loadAccepted(){
    try{
      const raw = localStorage.getItem(LS_ACCEPTED_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveAccepted(list){ localStorage.setItem(LS_ACCEPTED_KEY, JSON.stringify(list)); }

  function formatDate(ts){ return new Date(ts).toLocaleString(); }

  // === Job card template ===
  function createJobCard(job, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'job-card';

    const left = document.createElement('div');
    left.style.flex = '1';

    const title = document.createElement('h3'); title.textContent = job.title;
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = `${job.category || '—'} • ${job.location || '—'} • ₹${job.pay || 0}`;

    const desc = document.createElement('p'); desc.textContent = job.description || '';
    const contact = document.createElement('p'); contact.className = 'muted';
    contact.textContent = `Contact: ${job.contact || '—'}`;

    left.appendChild(title);
    left.appendChild(meta);
    left.appendChild(desc);
    left.appendChild(contact);

    const right = document.createElement('div');
    right.className = 'job-actions';

    if (opts.showContactLink && job.contact) {
      const mail = document.createElement('a');
      mail.href = `mailto:${job.contact}`;
      mail.textContent = 'Contact';
      mail.className = 'btn btn-contact';
      right.appendChild(mail);
    }

    if (opts.showAcceptBtn) {
      const btn = document.createElement('button');
      btn.textContent = 'Accept Job';
      btn.className = 'btn btn-accept';
      btn.onclick = function(){
        if (opts.onAccept) opts.onAccept(job);
      };
      right.appendChild(btn);
    }

    if (opts.showDelete) {
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.className = 'btn btn-delete';
      del.onclick = function(){
        if (opts.onDelete) opts.onDelete(job);
      };
      right.appendChild(del);
    }

    wrap.appendChild(left);
    wrap.appendChild(right);
    return wrap;
  }

  // === MAIN PAGE LOGIC ===
  document.addEventListener('DOMContentLoaded', function(){
    const path = window.location.pathname.split('/').pop() || 'index.html';

    // === LOGIN / SIGNUP PROTECTION ===
    const loggedIn = localStorage.getItem('LocalWorkHub_loggedIn');
    const publicPages = ['login.html', 'signup.html', 'index.html'];

    // redirect to login if not logged in
    if (!loggedIn && !publicPages.includes(path)) {
      window.location.href = 'login.html';
      return;
    }

    // add logout if logged in
    if (loggedIn) {
      const nav = document.querySelector('.site-header nav');
      if (nav) {
        const userLabel = document.createElement('span');
        userLabel.textContent = `Welcome, ${loggedIn}`;
        userLabel.style.color = 'var(--muted)';
        userLabel.style.marginRight = '10px';

        const logout = document.createElement('a');
        logout.textContent = 'Logout';
        logout.href = '#';
        logout.onclick = () => {
          localStorage.removeItem('LocalWorkHub_loggedIn');
          window.location.href = 'login.html';
        };

        nav.appendChild(userLabel);
        nav.appendChild(logout);
      }
    }

    // === NAVIGATION HIGHLIGHT ===
    document.querySelectorAll('.site-header nav a').forEach(a=>{
      const href = a.getAttribute('href') || '';
      if (href === path || (href === 'index.html' && path === '')) a.classList.add('active');
    });

    // === INDEX PAGE ===
    if (path === '' || path === 'index.html') return;

    // === POST PAGE ===
    if (path === 'post.html') {
      const form = document.getElementById('postForm');
      const msg = document.getElementById('postMessage');
      if (!form) return;

      form.addEventListener('submit', function(e){
        e.preventDefault();
        const fd = new FormData(form);
        const job = {
          id: 'job_' + Date.now(),
          title: (fd.get('title') || '').trim(),
          category: (fd.get('category') || '').trim(),
          pay: Number(fd.get('pay') || 0),
          location: (fd.get('location') || '').trim(),
          description: (fd.get('description') || '').trim(),
          contact: (fd.get('contact') || '').trim(),
          postedAt: Date.now()
        };
        const jobs = loadJobs();
        jobs.unshift(job);
        saveJobs(jobs);
        form.reset();
        msg.textContent = 'Job posted! Redirecting to Browse...';
        setTimeout(()=> { window.location.href = 'browse.html'; }, 700);
      });
      return;
    }

    // === BROWSE PAGE ===
    if (path === 'browse.html') {
      const listEl = document.getElementById('jobsList');
      const search = document.getElementById('searchInput');
      const chipsContainer = document.getElementById('categoryChips');

      function render(){
        listEl.innerHTML = '';
        const all = loadJobs();
        const q = (search.value || '').toLowerCase();

        // Build unique category list
        const cats = Array.from(new Set(all.map(j => j.category && j.category.trim()).filter(Boolean)));
        chipsContainer.innerHTML = '';

        // Current selected category
        let currentCat = chipsContainer.getAttribute('data-active') || '';

        // "All" chip
        const allChip = document.createElement('div');
        allChip.textContent = 'All';
        allChip.className = 'chip' + (currentCat === '' ? ' active' : '');
        allChip.onclick = () => {
          chipsContainer.setAttribute('data-active', '');
          render();
        };
        chipsContainer.appendChild(allChip);

        // Category chips
        cats.forEach(cat => {
          const chip = document.createElement('div');
          chip.textContent = cat;
          chip.className = 'chip' + (currentCat === cat ? ' active' : '');
          chip.onclick = () => {
            chipsContainer.setAttribute('data-active', cat);
            render();
          };
          chipsContainer.appendChild(chip);
        });

        currentCat = chipsContainer.getAttribute('data-active') || '';

        // Filter jobs
        const filtered = all.filter(j => {
          if (currentCat && j.category !== currentCat) return false;
          if (!q) return true;
          return (j.title + ' ' + (j.description || '') + ' ' + (j.location || '')).toLowerCase().includes(q);
        });

        if (filtered.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'muted';
          empty.textContent = 'No jobs found.';
          listEl.appendChild(empty);
        } else {
          filtered.forEach(job => {
            const card = createJobCard(job, {
              showAcceptBtn: true,
              showContactLink: true,
              showDelete: true,
              onAccept: function(j){
                const accepted = loadAccepted();
                accepted.unshift(Object.assign({}, j, { acceptedAt: Date.now() }));
                saveAccepted(accepted);
                const jobsLeft = loadJobs().filter(x => x.id !== j.id);
                saveJobs(jobsLeft);
                render();
                alert('You accepted: ' + j.title);
              },
              onDelete: function(j){
                const ok = confirm('Delete this job permanently?');
                if(!ok) return;
                const next = loadJobs().filter(x => x.id !== j.id);
                saveJobs(next);
                render();
                alert('Job deleted.');
              }
            });
            listEl.appendChild(card);
          });
        }
      }

      search.addEventListener('input', render);
      render();
      return;
    }

    // === ACCEPTED JOBS PAGE ===
    if (path === 'accepted.html') {
      const listEl = document.getElementById('acceptedList');
      function renderAccepted(){
        listEl.innerHTML = '';
        const accepted = loadAccepted();
        if (!accepted.length) {
          const p = document.createElement('p');
          p.className = 'muted';
          p.textContent = "You haven't accepted any jobs yet.";
          listEl.appendChild(p);
          return;
        }
        accepted.forEach(job => {
          const card = createJobCard(job, {
            showContactLink:true,
            showAcceptBtn:false,
            showDelete:true,
            onDelete: function(j){
              const ok = confirm('Remove from accepted list and return to jobs?');
              if (!ok) return;
              const acceptedNow = loadAccepted().filter(x => x.id !== j.id);
              saveAccepted(acceptedNow);
              const jobs = loadJobs();
              jobs.unshift(Object.assign({}, j, { postedAt: Date.now() }));
              saveJobs(jobs);
              renderAccepted();
              alert('Job moved back to Browse.');
            }
          });
          const acceptedAt = document.createElement('div');
          acceptedAt.className = 'muted';
          acceptedAt.textContent = 'Accepted at: ' + formatDate(job.acceptedAt || job.postedAt || Date.now());
          card.appendChild(acceptedAt);
          listEl.appendChild(card);
        });
      }
      renderAccepted();
      return;
    }
  });

  // === expose helper for debugging ===
  window.__LocalWorkHub = { loadJobs, saveJobs, loadAccepted, saveAccepted };

})();
