(() => {
  Promise.all([
    func(200, true),
    func(300, true),
    func(400, false),
    func(500, true),
  ])
    .then(() => {
      console.log('all resolve');
    })
    .catch((e) => {
      console.log(e);
    });
})();

function func(time, flag) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(time, flag);
      flag ? resolve() : reject();
    }, time);
  });
}
