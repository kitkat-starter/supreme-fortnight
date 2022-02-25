const fs = require("fs-extra");
// 文件夹
let testDir = "/tmp";
// 文件
let testFile = "/tmp/entrypoint.sh";
// 测试文件夹
console.log(fs.existsSync(testDir));
// 测试文件
console.log(fs.existsSync(testFile));
