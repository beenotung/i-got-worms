const make_input = (name, type) =>
  `<tr>
<td><label for="${name}">${name}</label></td>
<td><button id="${name}-down">v 1e3</button></td>
<td><input id="${name}" name="${name}" type="${type}"></td>
<td><button id="${name}-up">^ 1e3</button></td>
</tr>`;

const make_inputs = options => {
  return `<table><tbody>${options
    .map(([name, type]) => make_input(name, type))
    .join('')}</tbody></table>`;
};
const in_array = (x, xs) => xs.indexOf(x) !== -1;

const build = options => {
  const names = options.map(x => x[0]);
  const s = make_inputs(options);
  const e = document.createElement('div');
  e.innerHTML = s;
  document.body.append(e);
  const xs = e.querySelectorAll('[id]');
  const res: any = {};
  xs.forEach(x => {
    res[x.id] = x;
  });
  names.forEach(name => {
    res[`${name}-up`].onclick = () => {
      res[name].value = res[name].value * 1000;
    };
    res[`${name}-down`].onclick = () => {
      res[name].value = res[name].value / 1000;
    };
  });
  res.get = id => {
    return res[id].value * 1;
  };
  return res;
};
let inputs = build([
  ['cash', 'text'],
  ['production_rate', 'text'],
  ['target', 'text'],
  ['up_percent', 'text'],
  ['up_cost', 'text'],
  ['up_ratio', 'text'],
]);

const calc = document.createElement('button');
calc.textContent = 'calc';
document.body.append(calc);

const output = document.createElement('div');
document.body.append(output);

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
  let msg = '';
  let diff = 0;
  let unit = '';

  const rate = inputs.get('production_rate');
  const cash = inputs.get('cash');
  const target = inputs.get('target');

  diff = (target - cash) / rate;
  [diff, unit] = format_time(diff);
  msg += `<p>${round_number(diff)} ${unit} for target</p>`;

  const up_percent = inputs.get('up_percent');
  const up_cost = inputs.get('up_cost');
  const up_ratio = inputs.get('up_ratio');
  const up_rate = (up_ratio * rate) / 100;

  diff = (target - cash + up_cost) / (rate + (up_rate * up_percent) / 100);
  [diff, unit] = format_time(diff);
  msg += `<p>${round_number(diff)} ${unit} if upgrade</p>`;

  output.innerHTML = msg;
};
