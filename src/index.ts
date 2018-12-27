import { displayJSON } from '@beenotung/tslib/html';

const make_input = (name, type, step, min) =>
  `<tr>
<td><label for="${name}">${name}</label></td>
<td><button id="${name}-down">v 1e3</button></td>
<td><input id="${name}" name="${name}" type="${type}" step="${step}" min="${min}"></td>
<td><button id="${name}-up">^ 1e3</button></td>
</tr>`;

const make_inputs = options => {
  return `<table><tbody>${options
    .map(([name, type, step, min]) => make_input(name, type, step, min))
    .join('')}</tbody></table>`;
};
// const in_array = (x, xs) => xs.indexOf(x) !== -1;

const build = options => {
  const names = options.map(x => x[0]);
  const s = make_inputs(options);
  const e = document.createElement('div');
  e.innerHTML = s;
  document.body.append(e);
  const es = e.querySelectorAll('[id]');
  const res: {
    [id: string]: HTMLInputElement;
  } & {
    get: (id: string) => number;
    set: (id: string, value: number) => void;
  } = {
    get: (id: string) => +res[id].value,
    set: (id: string, value: number) => (res[id].value = value.toString()),
  } as any;
  es.forEach((e: HTMLInputElement) => {
    res[e.id] = e;
    e.value = localStorage.getItem(e.id);
    e.onchange = evt => {
      localStorage.setItem(e.id, e.value);
    };
  });
  names.forEach(name => {
    res[`${name}-up`].onclick = () => {
      const e = res[name];
      e.value = (+e.value * 1000).toString();
      localStorage.setItem(e.id, e.value);
    };
    res[`${name}-down`].onclick = () => {
      const e = res[name];
      e.value = (+e.value / 1000).toString();
      localStorage.setItem(e.id, e.value);
    };
  });
  return res;
};
const inputType = 'number';
const stepSize = 1 / 1000 / 1000;
const minValue = 0;
const inputs = build(
  [
    ['cash'],
    ['production_rate'],
    ['target'],
    ['up_percent'],
    ['up_cost'],
    ['up_ratio'],
  ].map(([name]) => [name, inputType, stepSize, minValue]),
);

const calc = document.createElement('button');
calc.textContent = 'calc';
document.body.append(calc);

const upgrade = document.createElement('button');
upgrade.textContent = 'upgrade';
document.body.appendChild(upgrade);

const outputContainer = document.createElement('div');
outputContainer.id = 'output';
document.body.append(outputContainer);
outputContainer.innerHTML = `<style>
#output td {
  border: 1px solid black;
  padding: 0.5em;
}
</style>`;
const output = document.createElement('div');
outputContainer.append(output);

const round_number = x => {
  return Math.round(x * 100) / 100;
};

const format_time = diff => {
  let unit = 'seconds';
  if (diff > 3600 * 24) {
    diff /= 3600 * 24;
    unit = 'days';
  }
  if (diff > 3600) {
    diff /= 3600;
    unit = 'hours';
  } else if (diff > 60) {
    diff /= 60;
    unit = 'minutes';
  }
  return [diff, unit];
};

calc.onclick = event => {
  const msgs: { [name: string]: string } = {};
  let diff_time = 0;
  let diff_unit = '';
  let diff_time_text = '';

  const rate = inputs.get('production_rate');
  const cash = inputs.get('cash');
  const target = inputs.get('target');

  diff_time = (target - cash) / rate;
  diff_time = Math.max(diff_time, 0);
  diff_time_text = new Date(Date.now() + diff_time * 1000).toLocaleString();
  [diff_time, diff_unit] = format_time(diff_time);
  msgs['reach target'] = `${round_number(
    diff_time,
  )} ${diff_unit}</td><td>${diff_time_text}`;

  const up_percent = inputs.get('up_percent');
  const up_cost = inputs.get('up_cost');
  const up_ratio = inputs.get('up_ratio');

  diff_time = (up_cost - cash) / rate;
  diff_time = Math.max(diff_time, 0);
  diff_time_text = new Date(Date.now() + diff_time * 1000).toLocaleString();
  const time_to_upgrade = diff_time;
  [diff_time, diff_unit] = format_time(diff_time);
  msgs.upgrade = `${round_number(
    diff_time,
  )} ${diff_unit}</td><td>${diff_time_text}`;

  // assume the upgrade will used up all cash
  const new_cash = cash + time_to_upgrade * rate - up_cost;
  const other_rate = rate * (1 - up_ratio / 100);
  const new_up_rate = rate * (up_ratio / 100) * (1 + up_percent / 100);
  const new_rate = other_rate + new_up_rate;
  diff_time = time_to_upgrade + (target - new_cash) / new_rate;
  diff_time = Math.max(diff_time, 0);
  diff_time_text = new Date(Date.now() + diff_time * 1000).toLocaleString();
  [diff_time, diff_unit] = format_time(diff_time);
  msgs['reach target if upgrade'] = `${round_number(
    diff_time,
  )} ${diff_unit}</td><td>${diff_time_text}`;

  const table = displayJSON(msgs, 'table');

  output.innerHTML = '<p>Time to:</p>' + table;

  upgrade.onclick = event => {
    const new_up_ratio = (new_up_rate / new_rate) * 100;
    inputs.set('cash', new_cash);
    inputs.set('production_rate', new_rate);
    inputs.set('up_ratio', new_up_ratio);
    calc.onclick(event);
  };
};
