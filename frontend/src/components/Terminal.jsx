import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';

const Terminal = ({ socket, sshPort, containerId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!socket || !sshPort || !terminalRef.current) return;

    // Initialize terminal
    const term = new XTerm({
      cursorBlink: true,
      scrollback: 5000,
      convertEol: true,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
      fontSize: 14,
      theme: {
        background: '#0E1116',
        foreground: '#00FF9C',
        cursor: '#00FF9C',
        cursorAccent: '#0E1116',
        selectionBackground: '#003B33',
        black: '#000000',
        red: '#E06C75',
        green: '#98C379',
        yellow: '#E5C07B',
        blue: '#61AFEF',
        magenta: '#C678DD',
        cyan: '#56B6C2',
        white: '#ABB2BF',
        brightBlack: '#5C6370',
        brightRed: '#E06C75',
        brightGreen: '#98C379',
        brightYellow: '#E5C07B',
        brightBlue: '#61AFEF',
        brightMagenta: '#C678DD',
        brightCyan: '#56B6C2',
        brightWhite: '#FFFFFF',
      },
    });

    // Add addons
    const fitAddon = new FitAddon();
    const linkAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(linkAddon);
    term.loadAddon(searchAddon);

    // Open terminal
    term.open(terminalRef.current);
    fitAddon.fit();
    term.focus();

    // Store refs
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\r\n🟢 Connecting to your Linux lab...\r\n');

    // Start shell session
    socket.emit('start-shell', { sshPort, containerId });

    // Listen for output
    const handleOutput = (data) => {
      term.write(data);
    };

    const handleShellReady = ({ message }) => {
      term.writeln(`\r\n✅ ${message}\r\n`);
    };

    const handleShellError = ({ message }) => {
      term.writeln(`\r\n❌ Error: ${message}\r\n`);
    };

    socket.on('output', handleOutput);
    socket.on('shell-ready', handleShellReady);
    socket.on('shell-error', handleShellError);

    // Handle input
    term.onData((data) => {
      socket.emit('input', data);
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      socket.emit('resize', {
        rows: term.rows,
        cols: term.cols,
      });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      socket.off('output', handleOutput);
      socket.off('shell-ready', handleShellReady);
      socket.off('shell-error', handleShellError);
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [socket, sshPort, containerId]);

  return (
    <div 
      ref={terminalRef} 
      className="terminal-container w-full h-full"
      style={{ minHeight: '600px' }}
    />
  );
};

export default Terminal;
