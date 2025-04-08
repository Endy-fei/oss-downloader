#!/usr/bin/env node

import { Command } from "commander";
import * as path from "path";
import { downloadFiles } from "../src/index";

const program = new Command();

program
  .name("aliyunoss-downloader")
  .description("批量下载 Aliyun OSS 文件，支持 MD5 检查与覆盖")
  .option("-c, --config <path>", "配置文件路径（默认 aliyunoss.config.jsonc）", "aliyunoss.config.jsonc")
  .parse(process.argv);

const options = program.opts();
const configPath = path.resolve(options.config);

downloadFiles(configPath).catch((err) => {
  console.error("下载失败：", err);
  process.exit(1);
});