const fs = require('fs');

let content = fs.readFileSync('client/src/components/ActionsTaken.tsx', 'utf8');

content = content.replace(
  /<label>Action Description \*\s*<\/label><br\/>\s*<textarea value=\{actionDescription\}/g,
  '<label htmlFor="actionDescription">Action Description *</label><br/>\n            <textarea id="actionDescription" value={actionDescription}'
);

content = content.replace(
  /<label>Result \*\s*<\/label><br\/>\s*<textarea value=\{result\}/g,
  '<label htmlFor="result">Result *</label><br/>\n            <textarea id="result" value={result}'
);

content = content.replace(
  /<label>\s*<input type="checkbox" checked=\{followUpRequired\}/g,
  '<label htmlFor="followUpRequired">\n              <input id="followUpRequired" type="checkbox" checked={followUpRequired}'
);

content = content.replace(
  /<label>Follow-up Note \*\s*<\/label><br\/>\s*<textarea value=\{followUpNote\}/g,
  '<label htmlFor="followUpNote">Follow-up Note *</label><br/>\n              <textarea id="followUpNote" value={followUpNote}'
);

content = content.replace(
  /<label>Attachment Notes\s*<\/label><br\/>\s*<textarea value=\{attachmentNotes\}/g,
  '<label htmlFor="attachmentNotes">Attachment Notes</label><br/>\n            <textarea id="attachmentNotes" value={attachmentNotes}'
);

fs.writeFileSync('client/src/components/ActionsTaken.tsx', content);
console.log("ActionsTaken fixed!");
