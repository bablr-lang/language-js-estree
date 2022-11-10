function* takeWhile(iterable, condition) {
  for (const value of iterable) {
    if (condition(value)) yield value;
    else break;
  }
}

function last(iterable) {
  let last;
  for (const value of iterable) last = value;
  return last;
}

module.exports = { takeWhile, last };
