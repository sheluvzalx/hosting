var term = new Terminal({
  convertEol: true,
  fontFamily: `'Fira Mono', monospace`,
  fontSize: 15,
  rendererType: "dom", // default is canvas
  cursorBlink: "block",
});
var curr_line = "";
var entries = [];
var currPos = 0;
var pos = 0;

term.write("Welcome To Discord Bot Panel Terminal");
term.open(document.getElementById("terminal"));
term.prompt = () => {
  if (curr_line == "clear" || curr_line == "cls") {
    term.clear();
    term.write("\r\n\u001b[34mSPECTRE> \u001b[37m");
    curr_line = "";
  } else {
    term.write(curr_line + "\r\n\u001b[34mDBP> \u001b[37m");
  }
};
term.prompt();

term.on("key", function (key, ev) {
  if (curr_line == "clear" || curr_line == "cls") {
    term.clear();
    term.write("\r\n\u001b[34mDBP> \u001b[37m");
    curr_line = "";
  } else {
    const printable =
      !ev.altKey &&
      !ev.altGraphKey &&
      !ev.ctrlKey &&
      !ev.metaKey &&
      !(ev.keyCode === 37 && term.buffer.cursorX < 6);

    if (ev.keyCode === 13) {
      // Enter key
      fetch(`../terminal/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: curr_line,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .then((myJson) => {
          if (myJson.Success == true) {
            term.write(`\r\n${myJson.Data}`);
          } else {
            term.write(`\r\n${myJson.Message}`);
          }
          term.prompt();
        });
      if (curr_line.replace(/^\s+|\s+$/g, "").length != 0) {
        // Check if string is all whitespace
        entries.push(curr_line);
        currPos = entries.length - 1;
      } else {
        term.write("\n\33[2K\u001b[34mDBP> \u001b[37m");
      }
      curr_line = "";
    } else if (ev.keyCode === 8) {
      // Backspace
      curr_line = curr_line.slice(0, -1);
      if (term.buffer.cursorX > 5) {
        curr_line =
          curr_line.slice(0, term.buffer.cursorX - 6) +
          curr_line.slice(term.buffer.cursorX - 5);
        pos = curr_line.length - term.buffer.cursorX + 6;
        term.write("\33[2K\r\u001b[34mDBP> \u001b[37m" + curr_line);
        term.write("\033[".concat(pos.toString()).concat("D")); //term.write('\033[<N>D');
        if (
          term.buffer.cursorX == 5 ||
          term.buffer.cursorX == curr_line.length + 6
        ) {
          term.write("\033[1C");
        }
      }
    } else if (ev.keyCode === 38) {
      // Up arrow
      if (entries.length > 0) {
        if (currPos > 0) {
          currPos -= 1;
        }
        curr_line = entries[currPos];
        term.write("\33[2K\r\u001b[34mDBP> \u001b[37m" + curr_line);
      }
    } else if (ev.keyCode === 40) {
      // Down arrow
      currPos += 1;
      if (currPos === entries.length || entries.length === 0) {
        currPos -= 1;
        curr_line = "";
        term.write("\33[2K\r\u001b[34mDBP> \u001b[37m");
      } else {
        curr_line = entries[currPos];
        term.write("\33[2K\r\u001b[34mDBP> \u001b[37m" + curr_line);
      }
    } else if (
      printable &&
      !(ev.keyCode === 39 && term.buffer.cursorX > curr_line.length + 4)
    ) {
      if (ev.keyCode != 37 && ev.keyCode != 39) {
        var input = ev.key;
        if (ev.keyCode == 9) {
          // Tab
          input = "    ";
        }
        pos = curr_line.length - term.buffer.cursorX + 4;
        curr_line = [
          curr_line.slice(0, term.buffer.cursorX - 5),
          input,
          curr_line.slice(term.buffer.cursorX - 5),
        ].join("");
        term.write("\33[2K\r\u001b[34mDBP> \u001b[37m" + curr_line);
        term.write("\033[".concat(pos.toString()).concat("D")); //term.write('\033[<N>D');
      } else {
        term.write(key);
      }
    }
  }
});

term.on("paste", function (data) {
  curr_line += data;
  term.write(curr_line);
});

term.setOption("theme", {
  background: "#1E2128",
});
