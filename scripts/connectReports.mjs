import fs from 'node:fs';

const file = 'src/app/App.jsx';
let text = fs.readFileSync(file, 'utf8');

const importLine = "import { ReportsWorkspace } from './components/ReportsWorkspace';";
if (!text.includes(importLine)) {
  text = text.replace(
    "import { EmployeeWorkspace } from './components/EmployeeWorkspace';",
    "import { EmployeeWorkspace } from './components/EmployeeWorkspace';\n" + importLine
  );
}

text = text.replace(
  "else if(page==='reports') content=<ModulePlaceholder title=\"Reports\" description=\"Operations, proof-of-service, customer, financial, and employee performance reports.\"/>;",
  "else if(page==='reports') content=<ReportsWorkspace data={data}/>;"
);

fs.writeFileSync(file, text);
