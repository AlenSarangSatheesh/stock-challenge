/**
 * UI Manager
 * Handles all UI rendering and DOM manipulation
 */

const UIManager = (function() {
  // DOM Elements
  const elements = {
    toggleEntryBtn: null,
    toggleText: null,
    toggleIcon: null,
    entryCard: null,
    entryForm: null,
    nameInput: null,
    symbolInput: null,
    exchangeInput: null,
    submitBtn: null,
    deleteBtn: null,
    refreshBtn: null,
    refreshIcon: null,
    tableBody: null,
    mobileList: null,
    participantsCount: null,
    formTitle: null,
    closeForm: null,
    errorBox: null,
    errorText: null,
    clearError: null,
    successBox: null,
    successText: null,
    clearSuccess: null,
    loadingState: null
  };

  /**
   * Initialize DOM element references
   */
  function initElements() {
    elements.toggleEntryBtn = document.getElementById('toggle-entry');
    elements.toggleText = document.getElementById('toggle-text');
    elements.toggleIcon = document.getElementById('toggle-icon');
    elements.entryCard = document.getElementById('entry-card');
    elements.entryForm = document.getElementById('entry-form');
    elements.nameInput = document.getElementById('name');
    elements.symbolInput = document.getElementById('symbol');
    elements.exchangeInput = document.getElementById('exchange');
    elements.submitBtn = document.getElementById('submit-btn');
    elements.deleteBtn = document.getElementById('delete-btn');
    elements.refreshBtn = document.getElementById('refresh-btn');
    elements.refreshIcon = document.getElementById('refresh-icon');
    elements.tableBody = document.getElementById('table-body');
    elements.mobileList = document.getElementById('mobile-list');
    elements.participantsCount = document.getElementById('participants-count');
    elements.formTitle = document.getElementById('form-title');
    elements.closeForm = document.getElementById('close-form');
    elements.errorBox = document.getElementById('error-box');
    elements.errorText = document.getElementById('error-text');
    elements.clearError = document.getElementById('clear-error');
    elements.successBox = document.getElementById('success-box');
    elements.successText = document.getElementById('success-text');
    elements.clearSuccess = document.getElementById('clear-success');
    elements.loadingState = document.getElementById('loading-state');
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Show error message
   */
  function showError(message) {
    elements.errorText.textContent = message;
    elements.errorBox.style.display = 'flex';
    elements.successBox.style.display = 'none';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideError();
    }, 5000);
  }

  /**
   * Hide error message
   */
  function hideError() {
    elements.errorBox.style.display = 'none';
    elements.errorText.textContent = '';
  }

  /**
   * Show success message
   */
  function showSuccess(message) {
    elements.successText.textContent = message;
    elements.successBox.style.display = 'flex';
    elements.errorBox.style.display = 'none';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      hideSuccess();
    }, 3000);
  }

  /**
   * Hide success message
   */
  function hideSuccess() {
    elements.successBox.style.display = 'none';
    elements.successText.textContent = '';
  }

  /**
   * Show loading state
   */
  function showLoading() {
    elements.loadingState.style.display = 'block';
    elements.tableBody.style.display = 'none';
    elements.mobileList.style.display = 'none';
  }

  /**
   * Hide loading state
   */
  function hideLoading() {
    elements.loadingState.style.display = 'none';
  }

  /**
   * Update participants count
   */
  function updateParticipantsCount(count) {
    const text = count === 1 ? '1 Participant' : `${count} Participants`;
    elements.participantsCount.textContent = text;
  }

  /**
   * Render leaderboard (both desktop and mobile)
   */
  function renderLeaderboard(participants) {
    hideLoading();
    updateParticipantsCount(participants.length);

    // Sort by rank
    const sorted = participants.slice().sort((a, b) => {
      if ((a.rank || 0) === 0 && (b.rank || 0) === 0) return 0;
      if ((a.rank || 0) === 0) return 1;
      if ((b.rank || 0) === 0) return -1;
      return a.rank - b.rank;
    });

    // Render desktop table
    renderDesktopTable(sorted);
    
    // Render mobile list
    renderMobileList(sorted);
    
    // Show tables
    elements.tableBody.style.display = '';
    elements.mobileList.style.display = '';
  }

  /**
   * Render desktop table view
   */
  function renderDesktopTable(participants) {
    elements.tableBody.innerHTML = '';

    if (participants.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'empty-state';
      td.innerHTML = `
        <div class="empty-state-icon">📊</div>
        <div>No participants yet. Be the first to join!</div>
      `;
      tr.appendChild(td);
      elements.tableBody.appendChild(tr);
      return;
    }

    participants.forEach((p, idx) => {
      const tr = document.createElement('tr');
      const isWinner = idx === 0 && (p.rank || 0) > 0;
      
      if (isWinner) {
        tr.className = 'winner-row';
      }

      const changeClass = p.change > 0 ? 'change-positive' : 
                         (p.change < 0 ? 'change-negative' : 'change-neutral');

      tr.innerHTML = `
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            ${isWinner ? '<span style="font-size:20px;">🏆</span>' : ''}
            <span style="font-weight:700; font-size:16px;">#${(p.rank || 0) === 0 ? '-' : p.rank}</span>
          </div>
        </td>
        <td>
          <div style="font-weight:700; font-size:15px;">${escapeHtml(p.name)}</div>
        </td>
        <td>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="color:#2563eb;font-weight:700;font-size:15px;">${escapeHtml(p.symbol)}</span>
            <span style="background:#f3f4f6;padding:4px 8px;border-radius:8px;font-size:12px;color:#374151;font-weight:500;">
              ${escapeHtml(p.exchange)}
            </span>
          </div>
        </td>
        <td style="text-align:right;color:#374151;font-size:14px;">
          ₹${(p.lastFridayPrice || 0).toFixed(2)}
        </td>
        <td style="text-align:right;font-weight:700;font-size:15px;">
          ₹${(p.cmp || 0).toFixed(2)}
        </td>
        <td style="text-align:right;">
          <span class="${changeClass}">
            ${p.change > 0 ? '+' : ''}${(p.change || 0).toFixed(2)}%
          </span>
        </td>
      `;

      elements.tableBody.appendChild(tr);
    });
  }

  /**
   * Render mobile list view
   */
  function renderMobileList(participants) {
    elements.mobileList.innerHTML = '';

    if (participants.length === 0) {
      const div = document.createElement('div');
      div.className = 'empty-state';
      div.innerHTML = `
        <div class="empty-state-icon">📊</div>
        <div>No participants yet. Be the first to join!</div>
      `;
      elements.mobileList.appendChild(div);
      return;
    }

    participants.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'participant-row';
      const isWinner = idx === 0 && (p.rank || 0) > 0;
      
      if (isWinner) {
        row.style.background = '#fffbeb';
        row.style.borderLeft = '4px solid #f59e0b';
      }

      const changeClass = p.change > 0 ? 'change-positive' : 
                         (p.change < 0 ? 'change-negative' : 'change-neutral');

      row.innerHTML = `
        <div class="participant-left">
          <div style="font-weight:700; font-size:18px; min-width:40px;">
            ${isWinner ? '🏆' : '#' + ((p.rank || 0) === 0 ? '-' : p.rank)}
          </div>
          <div>
            <div class="participant-name">${escapeHtml(p.name)}</div>
            <div class="participant-sub">
              ${escapeHtml(p.symbol)} 
              <span style="background:#f3f4f6;padding:3px 8px;border-radius:6px;font-size:12px;color:#374151;margin-left:6px;font-weight:500;">
                ${escapeHtml(p.exchange)}
              </span>
            </div>
            <div class="participant-meta">
              Base: ₹${(p.lastFridayPrice || 0).toFixed(2)} • Current: ₹${(p.cmp || 0).toFixed(2)}
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          <span class="${changeClass}">
            ${p.change > 0 ? '+' : ''}${(p.change || 0).toFixed(2)}%
          </span>
        </div>
      `;

      elements.mobileList.appendChild(row);
    });
  }

  /**
   * Show entry form (new or edit)
   */
  function showEntryForm(isEdit = false, participantData = null) {
    hideError();
    hideSuccess();
    
    if (isEdit && participantData) {
      elements.formTitle.textContent = 'Edit Entry';
      elements.submitBtn.textContent = 'Update Entry';
      elements.deleteBtn.style.display = 'inline-flex';
      
      elements.nameInput.value = participantData.name || '';
      elements.symbolInput.value = participantData.symbol || '';
      elements.exchangeInput.value = participantData.exchange || 'NSE';
    } else {
      elements.formTitle.textContent = 'Enter Challenge';
      elements.submitBtn.textContent = 'Submit Entry';
      elements.deleteBtn.style.display = 'none';
      
      elements.entryForm.reset();
    }
    
    elements.entryCard.style.display = 'block';
  }

  /**
   * Hide entry form
   */
  function hideEntryForm() {
    elements.entryCard.style.display = 'none';
    elements.entryForm.reset();
    elements.deleteBtn.style.display = 'none';
    hideError();
  }

  /**
   * Update header button based on user entry status
   */
  function updateHeaderButton(hasEntry) {
    if (hasEntry) {
      elements.toggleText.textContent = 'Edit';
      elements.toggleIcon.textContent = '✎';
    } else {
      elements.toggleText.textContent = 'Join';
      elements.toggleIcon.textContent = '+';
    }
  }

  /**
   * Set button loading state
   */
  function setButtonLoading(button, isLoading, loadingText = 'Processing...') {
    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  /**
   * Set refresh button state
   */
  function setRefreshLoading(isLoading) {
    if (isLoading) {
      elements.refreshBtn.disabled = true;
      elements.refreshBtn.textContent = ' Refreshing...';
      elements.refreshIcon.textContent = '⏳';
    } else {
      elements.refreshBtn.disabled = false;
      elements.refreshBtn.textContent = ' Refresh Prices';
      elements.refreshIcon.textContent = '🔄';
    }
  }

  /**
   * Get form values
   */
  function getFormValues() {
    return {
      name: elements.nameInput.value.trim(),
      symbol: elements.symbolInput.value.trim().toUpperCase(),
      exchange: elements.exchangeInput.value
    };
  }

  // Public API
  return {
    initElements,
    showError,
    hideError,
    showSuccess,
    hideSuccess,
    showLoading,
    hideLoading,
    renderLeaderboard,
    showEntryForm,
    hideEntryForm,
    updateHeaderButton,
    setButtonLoading,
    setRefreshLoading,
    getFormValues,
    elements
  };
})();