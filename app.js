const fs = require("fs");
const path = require("path");

const fileDir = process.argv[2];
const fileName = process.argv[3];
const fileEncode = process.argv[4];
const fileExt = process.argv[5];
const user = process.argv[6];
const filePath = path.join(fileDir, fileName);
const { throttle } = require("./throttle.js");
const isLess = (num) => (num < 10 ? "0" + num : num);

const timeFormat = now => {
  return `${now.getFullYear()}-${isLess(now.getMonth() + 1)}-${isLess(now.getDate())} ${isLess(now.getHours())}:${isLess(now.getMinutes())}`
}
// 支持的文件扩展名
const supportExt = ["js", "ts", "jsx", "tsx"];
// 配置
const config = {
  // 没有匹配到头时添加头
  addHeader: true,
  // 是否向vue、html文件注入头
  supportVueHtml: true,
}

// 新增：格式化日期字符串，将 2025/5/19 17:12 转换为 2025-05-19 17:12
const formatDateString = dateStr => {
  // 分离日期和时间部分
  const parts = dateStr.split(' ')
  const datePart = parts[0]
  const timePart = parts.length > 1 ? parts.slice(1).join(' ') : ''

  // 格式化日期部分
  if (datePart.includes('/')) {
    const datePieces = datePart.split('/')
    if (datePieces.length >= 3) {
      const year = datePieces[0]
      const month = isLess(parseInt(datePieces[1]))
      const day = isLess(parseInt(datePieces[2]))
      // 返回格式化后的日期和原始时间
      return `${year}-${month}-${day}${timePart ? ' ' + timePart : ''}`
    }
  }
  return dateStr
}

try {
  throttle().then((mainR) => {
    if (!mainR) {
      console.log("app-未通过", mainR);

    } else {
      console.log("app-通过", mainR);
      const source = fs.readFileSync(filePath, {
        encoding: fileEncode,
      });
      let sourceStr = source.toString();

      const editor = sourceStr.match(/(@LastEditors )(.*)/)
        ? sourceStr.match(/(@LastEditors )(.*)/)[0]
        : false;

      const time = sourceStr.match(/(@LastEditTime )(.*)/)
        ? sourceStr.match(/(@LastEditTime )(.*)/)[0]
        : false;

      // 新增：匹配 @Date 格式
      const dateMatch =
          sourceStr.match(/(@Date )(.*)/) ? sourceStr.match(/(@Date )(.*)/)[0] : false

      const date = timeFormat(new Date());

      if ((!editor || !time) && config.addHeader) {
        let header;
        if (supportExt.includes(fileExt)) {
          header = `/**\n * @Description desc\n * @Author ${user}\n * @Date ${date}\n * @LastEditors ${user}\n * @LastEditTime ${date}\n */\n`;
        } else if (["vue", "html"].includes(fileExt) && config.supportVueHtml) {
          header = `<!--\n * @Description desc\n * @Author ${user}\n * @Date ${date}\n * @LastEditors ${user}\n * @LastEditTime ${date}\n -->\n`;
        } else {
          // For other file types, you can define a default header here.
          header = `/**\n * @Description desc\n * @Author ${user}\n * @Date ${date}\n * @LastEditors ${user}\n * @LastEditTime ${date}\n */\n`;
        }
        sourceStr = header + sourceStr;
      } else {
        sourceStr = sourceStr.replace(editor, `@LastEditors ${user}`);
        sourceStr = sourceStr.replace(time, `@LastEditTime ${date}`);
      }
      // 新增：处理 @Date 格式
      if (dateMatch) {
        const dateValue = dateMatch.split('@Date ')[1]
        const formattedDate = formatDateString(dateValue)
        sourceStr = sourceStr.replace(dateMatch, `@Date ${formattedDate}`)
      }
      fs.writeFileSync(filePath, sourceStr, { encoding: fileEncode })
    }

  });
} catch (e) {
  console.log(e);
}
