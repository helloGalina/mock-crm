import { applications } from "./data.js";

let currentPage = 1;
let sortColumn = "number";
let sortDirection = "asc";
let searchTerm = "";
let filters = {
  direction: "",
  objectType: "",
  status: ""
};

document.addEventListener("DOMContentLoaded", () => {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  [...tooltipTriggerList].forEach((el) => new bootstrap.Tooltip(el));

  renderTable(currentPage);

  initSorting();
  initSearch();
  initPageSize();
  initShowClosed();
  initResetFilters();
  initDropdownFilters();
});

function initDropdownFilters() {
  document.querySelectorAll('.dropdown-menu a[data-filter]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const filterKey = el.dataset.filter;
      const value = el.dataset.value;

      filters[filterKey] = value;

      const btn = el.closest('.dropdown').querySelector('button');
      btn.innerHTML = btn.innerHTML.split(':')[0] + ': ' + (value || 'Все');

      renderTable(1);
    });
  });
}

function getStatusClass(status) {
  const statusMap = {
    "На проверке": "on-review",
    "В работе": "in-progress",
    "На доработке": "needs-revision",
    "Принято": "approved",
    "С замечаниями": "with-remarks",
    "Направлено на проверку": "sent-for-review",
  };
  return statusMap[status] || "secondary";
}

function formatMoney(value) {
  return value ? Number(value).toLocaleString("ru-RU") : "—";
}

function renderTable(page = 1) {
  currentPage = page;
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const pageSize = parseInt(document.getElementById("pageSize")?.value) || 20;
  const showClosed = document.getElementById("showClosed")?.checked || false;

  let data = applications.filter(item => {
    if (showClosed) {
      return item.closed && item.status === "Принято";
    }
    return true;
  });


  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    data = data.filter(
      (item) =>
        item.number.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.inn.includes(term)
    );
  }

  data = data.filter(item => {
    for (let key in filters) {
      if (filters[key] && item[key] !== filters[key]) return false;
    }
    return true;
  });

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    data = data.filter(
      (item) =>
        item.number.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.inn.includes(term)
    );
  }

  data.sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (sortColumn === "date") {
      valA = new Date(valA.split(".").reverse().join("-"));
      valB = new Date(valB.split(".").reverse().join("-"));
    } else if (["fundVV", "fundODO", "chv", "vst"].includes(sortColumn)) {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  document.getElementById("totalCount").textContent = data.length;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = data.slice(start, end);

  pageItems.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.number}</td>
      <td>${item.direction}</td>
      <td data-bs-toggle="tooltip" data-bs-title="${item.name}">
        ${item.name.length > 35 ? item.name.slice(0, 32) + "..." : item.name}
      </td>
      <td>${item.inn}</td>
      <td>${item.objectType}</td>
      <td>
        <span class="status-badge status-${getStatusClass(item.status)}">
          ${item.status}
        </span>
      </td>
      <td class="text-end">${formatMoney(item.fundVV)}</td>
      <td class="text-end">${formatMoney(item.fundODO)}</td>
      <td class="text-end">${formatMoney(item.chv)}</td>
      <td class="text-end">${formatMoney(item.vst)}</td>
      <td>
        ${item.status !== "Принято" 
          ? `<button class="btn btn-sm btn-outline-primary"><i class="bi bi-download"></i> Запросить</button>` 
          : "—"}
      </td>
      <td>
        ${item.status.includes("доработ") || item.status === "С замечаниями"
          ? `<button class="btn btn-sm btn-outline-secondary"><i class="bi bi-file-earmark-arrow-down"></i> Скачать</button>`
          : "—"}
      </td>
      <td>${item.date}</td>
    `;
    tbody.appendChild(row);
  });

  updatePagination(page, Math.ceil(data.length / pageSize));
}

function initSorting() {
  document.querySelectorAll("thead th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const newColumn = th.dataset.sort;

      if (newColumn === sortColumn) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortColumn = newColumn;
        sortDirection = "asc";
      }

      document.querySelectorAll(".sort-icon").forEach((icon) => {
        icon.className = "bi bi-arrow-down-up sort-icon";
      });

      const icon = th.querySelector(".sort-icon");
      if (icon) {
        icon.classList.add(sortDirection === "asc" ? "bi-arrow-up-short" : "bi-arrow-down-short");
        icon.classList.add("active");
      }

      renderTable(currentPage);
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      searchTerm = searchInput.value;
      renderTable(1);
    }, 400));
  }
}

function initPageSize() {
  document.getElementById("pageSize")?.addEventListener("change", () => renderTable(1));
}

function initShowClosed() {
  document.getElementById("showClosed")?.addEventListener("change", () => renderTable(1));
}

function initResetFilters() {
  document.getElementById("resetFilters")?.addEventListener("click", () => {
    searchTerm = "";
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    for (let key in filters) filters[key] = "";
    document.querySelectorAll('.filter-bar .dropdown button').forEach(btn => {
      btn.innerHTML = btn.innerHTML.split(':')[0] + ': Все';
    });

    renderTable(1);
  });
}

function updatePagination(current, totalPages) {
  const container = document.getElementById("pagination");
  if (!container) return;

  container.innerHTML = "";

  if (totalPages <= 1) {
    document.getElementById("pageInfo").textContent = "";
    return;
  }

  const prev = document.createElement("li");
  prev.className = `page-item ${current === 1 ? "disabled" : ""}`;
  prev.innerHTML = `<a class="page-link" href="#">«</a>`;
  prev.addEventListener("click", (e) => { e.preventDefault(); if (current > 1) renderTable(current - 1); });
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 2 && i <= current + 2)) {
      const li = document.createElement("li");
      li.className = `page-item ${i === current ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => { e.preventDefault(); renderTable(i); });
      container.appendChild(li);
    } else if ((i === current - 3 && current > 4) || (i === current + 3 && current < totalPages - 3)) {
      const li = document.createElement("li");
      li.className = "page-item disabled";
      li.innerHTML = `<a class="page-link">...</a>`;
      container.appendChild(li);
    }
  }

  const next = document.createElement("li");
  next.className = `page-item ${current === totalPages ? "disabled" : ""}`;
  next.innerHTML = `<a class="page-link" href="#">»</a>`;
  next.addEventListener("click", (e) => { e.preventDefault(); if (current < totalPages) renderTable(current + 1); });
  container.appendChild(next);

  document.getElementById("pageInfo").textContent = `${current} из ${totalPages}`;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
