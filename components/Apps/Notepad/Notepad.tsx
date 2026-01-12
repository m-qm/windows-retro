'use client';

import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'notepad-content';

export const Notepad: React.FC = () => {
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setContent(saved);
    }
  }, []);

  useEffect(() => {
    // Save to localStorage on change
    if (content !== '') {
      localStorage.setItem(STORAGE_KEY, content);
      setHasUnsavedChanges(false);
    }
  }, [content]);

  const handleNew = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Create a new document?')) {
      return;
    }
    setContent('');
    setHasUnsavedChanges(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'text/plain';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setContent(event.target?.result as string);
          setHasUnsavedChanges(false);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSave = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  };

  const handleCut = () => {
    textareaRef.current?.focus();
    document.execCommand('cut');
  };

  const handleCopy = () => {
    textareaRef.current?.focus();
    document.execCommand('copy');
  };

  const handlePaste = () => {
    textareaRef.current?.focus();
    document.execCommand('paste');
  };

  const handleSelectAll = () => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      {/* Menu Bar */}
      <div
        style={{
          display: 'flex',
          background: '#c0c0c0',
          borderBottom: '1px solid #808080',
          fontSize: '11px',
        }}
      >
        <div
          style={{
            padding: '2px 8px',
            cursor: 'pointer',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#000080';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#000000';
          }}
        >
          File
        </div>
        <div
          style={{
            padding: '2px 8px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#000080';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#000000';
          }}
        >
          Edit
        </div>
      </div>

      {/* Toolbar */}
      <div className="win-toolbar">
        <button className="win-toolbar-button" onClick={handleNew} title="New">
          New
        </button>
        <button className="win-toolbar-button" onClick={handleOpen} title="Open">
          Open
        </button>
        <button className="win-toolbar-button" onClick={handleSave} title="Save">
          Save
        </button>
        <div style={{ width: '1px', background: '#808080', margin: '0 4px' }} />
        <button className="win-toolbar-button" onClick={handleCut} title="Cut">
          Cut
        </button>
        <button className="win-toolbar-button" onClick={handleCopy} title="Copy">
          Copy
        </button>
        <button className="win-toolbar-button" onClick={handlePaste} title="Paste">
          Paste
        </button>
        <button className="win-toolbar-button" onClick={handleSelectAll} title="Select All">
          Select All
        </button>
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        className="win-input"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setHasUnsavedChanges(true);
        }}
        style={{
          flex: 1,
          border: 'none',
          padding: '4px',
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          resize: 'none',
          outline: 'none',
        }}
        placeholder="Type your text here..."
      />

      {/* Status Bar */}
      <div className="win-statusbar">
        <span>
          {content.length} character(s)
          {hasUnsavedChanges && ' • Unsaved changes'}
        </span>
      </div>
    </div>
  );
};

