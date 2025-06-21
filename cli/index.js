#!/usr/bin/env node
const { Command } = require('commander');
const axios = require('axios');
const EventSource = require('eventsource');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const program = new Command();
program.name('class-analyze');

const DEFAULT_HOST = 'http://localhost:3000';

program
  .command('submit <file>')
  .option('-h, --host <url>', 'Backend host', DEFAULT_HOST)
  .description('Submit a transcript file (json or txt)')
  .action(async (file, opts) => {
    const host = opts.host;
    const ext = path.extname(file).toLowerCase();
    const url =
      ext === '.json'
        ? `${host}/pipeline-task/upload`
        : `${host}/pipeline-task/upload-text`;
    try {
      const fd = new FormData();
      fd.append('file', fs.createReadStream(file));
      const res = await axios.post(url, fd, {
        headers: fd.getHeaders(),
      });
      console.log('Task created:', res.data.id);
    } catch (err) {
      console.error('Failed to submit task:', err.message);
    }
  });

program
  .command('watch <taskId>')
  .option('-h, --host <url>', 'Backend host', DEFAULT_HOST)
  .description('Watch task progress and logs')
  .action((taskId, opts) => {
    const host = opts.host;
    const progressUrl = `${host}/pipeline-task/${taskId}/events`;
    const logUrl = `${host}/pipeline-task/${taskId}/logs`;

    const printEvent = (label) => (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log(`[${label}]`, data);
      } catch {
        console.log(`[${label}]`, e.data);
      }
    };

    console.log('Watching task', taskId);
    const progressSource = new EventSource(progressUrl);
    progressSource.onmessage = printEvent('progress');

    const logSource = new EventSource(logUrl);
    logSource.onmessage = printEvent('log');
  });

program.parse(process.argv);
