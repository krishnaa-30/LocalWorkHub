// app.js - shared by all pages
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

  // Utility to create job card element (used on browse and accepted pages)
  function createJobCard(job, opts = {}) {
    // opts: { onAccept, showAcceptBtn (bool), showContactLink (bool) }
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
    right.style.display = 'flex';
    right.style.flexDirection = 'column';
    right.style.gap = '8px';
    right.style.alignItems = 'flex-end';

    if (opts.showContactLink && job.contact) {
      const mail = document.createElement('a');
      mail.href = `mailto:${job.contact}`;
      mail.textContent = 'Contact';
      mail.className = 'btn btn-outline';
      mail.style.padding = '6px 8px';
      right.appendChild(mail);
    }

    if (opts.showAcceptBtn) {
      const btn = document.createElement('button');
      btn.textContent = 'Accept Job';
      btn.className = 'btn btn-primary';
      btn.onclick = function(){
        if (opts.onAccept) opts.onAccept(job);
      };
      right.appendChild(btn);
    }

    wrap.appendChild(left);
    wrap.appendChild(right);
    return wrap;
  }

  // Page-specific wiring
  document.addEventListener('DOMContentLoaded', function(){
    const path = window.location.pathname.split('/').pop() || 'index.html';

    if (path === '' || path === 'index.html') {
      // nothing dynamic needed on home for now
      return;
    }

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

    if (path === 'browse.html') {
      const listEl = document.getElementById('jobsList');
      const search = document.getElementById('searchInput');
      const categoryFilter = document.getElementById('categoryFilter');

      function render(){
        listEl.innerHTML = '';
        const all = loadJobs();
        // populate category filter
        const cats = Array.from(new Set(all.map(j => j.category).filter(Boolean)));
        categoryFilter.innerHTML = '<option value="">All categories</option>';
        cats.forEach(c => {
          const opt = document.createElement('option'); opt.value = c; opt.textContent = c;
          categoryFilter.appendChild(opt);
        });

        const q = (search.value || '').toLowerCase();
        const cat = categoryFilter.value;

        const filtered = all.filter(j => {
          if (cat && j.category !== cat) return false;
          if (!q) return true;
          return (j.title + ' ' + (j.description||'') + ' ' + (j.location||'')).toLowerCase().includes(q);
        });

        if (filtered.length === 0) {
          const empty = document.createElement('div'); empty.className = 'muted'; empty.textContent = 'No jobs found.';
          listEl.appendChild(empty);
        } else {
          filtered.forEach(job => {
            const card = createJobCard(job, {
              showAcceptBtn: true,
              showContactLink: true,
              onAccept: function(j){
                // accept job
                const accepted = loadAccepted();
                accepted.unshift(Object.assign({}, j, { acceptedAt: Date.now() }));
                saveAccepted(accepted);
                // remove from jobs
                const jobsLeft = loadJobs().filter(x => x.id !== j.id);
                saveJobs(jobsLeft);
                render(); // refresh list
                alert('You accepted: ' + j.title);
              }
            });
            listEl.appendChild(card);
          });
        }
      }

      search.addEventListener('input', render);
      categoryFilter.addEventListener('change', render);

      render();
      return;
    }

    if (path === 'accepted.html') {
      const listEl = document.getElementById('acceptedList');
      function renderAccepted(){
        listEl.innerHTML = '';
        const accepted = loadAccepted();
        if (!accepted.length) {
          const p = document.createElement('p'); p.className = 'muted'; p.textContent = "You haven't accepted any jobs yet.";
          listEl.appendChild(p);
          return;
        }
        accepted.forEach(job => {
          const card = createJobCard(job, { showContactLink:true, showAcceptBtn:false });
          const acceptedAt = document.createElement('div'); acceptedAt.className = 'muted';
          acceptedAt.textContent = 'Accepted at: ' + formatDate(job.acceptedAt || job.postedAt || Date.now());
          card.appendChild(acceptedAt);
          listEl.appendChild(card);
        });
      }
      renderAccepted();
      return;
    }
  });

  // expose helpers for debugging in console if needed
  window.__LocalWorkHub = {
    loadJobs, saveJobs, loadAccepted, saveAccepted
  };

})();
