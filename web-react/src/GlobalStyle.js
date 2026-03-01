import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0d0d18;
    color: #c9d1e0;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
  }

  /* Table */
  table { border-collapse: separate; border-spacing: 0; width: fit-content; }

  thead th {
    background: #0a0a14;
    color: #546e7a;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 5px 8px;
    text-align: center;
    border-bottom: 2px solid #1a1a2e;
    white-space: nowrap;
  }
  thead th:first-child { text-align: left; padding-left: 10px; }
  thead th.sep { border-left: 1px solid #1e1e38; }

  tr.day-header td {
    background: #111128;
    color: #7986cb;
    font-size: 0.75rem;
    padding: 5px 10px;
    border-top: 2px solid #1a1a2e;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  tr.source-header td {
    background: #0d0d1e;
    color: #78909c;
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    text-align: center;
    border-bottom: none;
    white-space: nowrap;
    font-weight: 600;
  }
  tr.source-header td.sep { border-left: 1px solid #1e1e38; }

  tr.sub-header td {
    background: #0d0d1e;
    color: #90a4ae;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    text-align: center;
    border-bottom: 1px solid #1a1a2e;
    white-space: nowrap;
    font-weight: 600;
  }
  tr.sub-header td:first-child { text-align: left; padding-left: 10px; }
  tr.sub-header td.sep { border-left: 1px solid #1e1e38; }

  tbody tr.data-row td { border-bottom: 1px solid rgba(255,255,255,0.03); }
  tbody tr.data-row:hover { filter: brightness(1.2); }

  td {
    padding: 3px 8px;
    text-align: center;
    font-weight: 700;
    font-size: 0.8rem;
    white-space: nowrap;
    line-height: 1;
    height: 26px;
    width: 1%;
  }
  td.hour {
    text-align: left;
    padding-left: 10px;
    font-weight: 700;
    color: #90a4ae;
    background: #0a0a14 !important;
    font-size: 0.75rem;
    border-right: 1px solid #1a1a2e;
    white-space: nowrap;
  }
  td.sep { border-left: 1px solid #1e1e38; }
  td.score-cell {
    border-right: 1px solid #1e1e38;
    font-size: 0.75rem;
    text-align: center;
    padding: 3px 6px;
  }

  tr.is-night td { background-color: #090912; }
  tr.is-day td { background-color: #0c0c1a; opacity: 0.5; }

  /* Cloud block gaps — transparent in data rows, inherited bg in headers */
  td.cloud-gap, th.cloud-gap {
    width: 5px !important;
    min-width: 5px;
    max-width: 5px;
    padding: 0 !important;
    border: none !important;
  }
  tr.data-row td.cloud-gap {
    background: transparent !important;
  }

  .score-go { color: #69f0ae; }
  .score-maybe { color: #ffd54f; }
  .score-no { color: #263238; }

  .content-area {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 24px;
    padding: 16px;
  }

  .main { flex-shrink: 0; }
`;

export default GlobalStyle;
