/* eslint-disable @typescript-eslint/no-deprecated */
import 'chai/register-should.js';
import * as editorconfig from './index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {Buffer} from 'node:buffer';

describe('parse', () => {
  const expected: editorconfig.Props = {
    indent_style: 'space',
    indent_size: 2,
    end_of_line: 'lf',
    charset: 'utf-8',
    trim_trailing_whitespace: true,
    insert_final_newline: true,
    tab_width: 2,
    block_comment: '*',
    block_comment_end: '*/',
    block_comment_start: '/**',
  };
  const target = path.join(import.meta.dirname, '/app.js');

  it('async', async() => {
    const cfg = await editorconfig.parse(target);
    cfg.should.eql(expected);
  });

  it('sync', () => {
    const visited: editorconfig.Visited[] = [];
    const cfg = editorconfig.parseSync(target, {files: visited});
    cfg.should.eql(expected);
    visited.should.have.lengthOf(1);
    visited[0].glob.should.eql('*');
    visited[0].fileName.should.match(/\.editorconfig$/);
  });

  it('caches', async() => {
    const cache = new Map();
    const cfg = await editorconfig.parse(target, {cache});
    cfg.should.eql(expected);
    cache.size.should.be.eql(2);
    await editorconfig.parse(target, {cache});
    cache.size.should.be.eql(2);
  });

  it('caches sync', () => {
    const cache = new Map();
    const cfg = editorconfig.parseSync(target, {cache});
    cfg.should.eql(expected);
    cache.size.should.be.eql(2);
    editorconfig.parseSync(target, {cache});
    cache.size.should.be.eql(2);
  });
});

describe('parseFromFiles', () => {
  const expected: editorconfig.Props = {
    block_comment_end: '*/',
    block_comment_start: '/**',
    block_comment: '*',
    charset: 'utf-8',
    end_of_line: 'lf',
    indent_size: 2,
    indent_style: 'space',
    insert_final_newline: true,
    tab_width: 2,
    trim_trailing_whitespace: true,
  };
  const configs: editorconfig.ECFile[] = [];
  const configPath = path.resolve(import.meta.dirname, '../.editorconfig');
  configs.push({
    name: configPath,
    contents: fs.readFileSync(configPath),
  });
  const target = path.join(import.meta.dirname, '/app.js');
  const configs2 = [
    {name: 'early', contents: Buffer.alloc(0)},
    configs[0],
  ];

  it('async', async() => {
    const cfg: editorconfig.Props =
      await editorconfig.parseFromFiles(target, Promise.resolve(configs));
    cfg.should.eql(expected);
  });

  it('sync', () => {
    const cfg = editorconfig.parseFromFilesSync(target, configs);
    cfg.should.eql(expected);
  });

  it('handles null', () => {
    const cfg = editorconfig.parseFromFilesSync(target, [{
      name: configPath,
      contents: Buffer.from('[*]\nfoo = null\n'),
    }]);
    cfg.should.eql({foo: 'null'});
  });

  it('caches async', async() => {
    const cache = new Map();
    const cfg = await editorconfig.parseFromFiles(
      target, Promise.resolve(configs2), {cache}
    );
    cfg.should.eql(expected);
    cache.size.should.be.eql(2);
    const cfg2 = await editorconfig.parseFromFiles(
      target, Promise.resolve(configs2), {cache}
    );
    cfg2.should.eql(expected);
    cache.size.should.be.eql(2);
  });

  it('caches sync', () => {
    const cache = new Map();
    const cfg = editorconfig.parseFromFilesSync(
      target, configs2, {cache}
    );
    cfg.should.eql(expected);
    cache.size.should.be.eql(2);
    const cfg2 = editorconfig.parseFromFilesSync(
      target, configs2, {cache}
    );
    cfg2.should.eql(expected);
    cache.size.should.be.eql(2);
  });

  it('handles minimatch escapables', () => {
    // Note that this `#` does not actually test the /^#/ escaping logic,
    // because this path will go through a `path.dirname` before that happens.
    // It's here to catch what would happen if minimatch started to treat #
    // differently inside a pattern.
    const bogusPath = path.resolve(import.meta.dirname, '#?*+@!()|[]{}');
    const escConfigs: editorconfig.ECFile[] = [
      {
        name: `${bogusPath}/.editorconfig`,
        contents: configs[0].contents,
      },
    ];
    const escTarget = `${bogusPath}/app.js`;
    const cfg = editorconfig.parseFromFilesSync(escTarget, escConfigs);
    cfg.should.eql(expected);
  });
});

describe('parseString', () => {
  const expected: editorconfig.ParseStringResult = [
    [null, {root: 'true'}],
    ['*', {
      block_comment_end: '*/',
      block_comment_start: '/**',
      block_comment: '*',
      charset: 'utf-8',
      end_of_line: 'lf',
      indent_size: '2',
      indent_style: 'space',
      insert_final_newline: 'true',
      trim_trailing_whitespace: 'true',
    }],
    ['*.md', {indent_size: '4'}],
  ];

  const configPath = path.resolve(import.meta.dirname, '../.editorconfig');
  const contents = fs.readFileSync(configPath, 'utf8');

  it('sync', () => {
    const cfg = editorconfig.parseString(contents);
    cfg.should.eql(expected);
  });

  it('handles errors', () => {
    const cfg = editorconfig.parseString('root: ');
    cfg.should.eql([[null, {}]]);
  });

  it('handles backslashes in glob', () => {
    const cfg = editorconfig.parseString('[a\\\\b]');
    cfg.should.eql([[null, {}], ['a\\\\b', {}]]);
  });

  it('handles blank comments', () => {
    const cfg = editorconfig.parseString('#');
    cfg.should.eql([[null, {}]]);
  });
});

describe('extra behavior', () => {
  it('handles extended globs', () => {
    // These failed when we had noext: true in matchOptions
    const matcher = editorconfig.matcher({
      root: import.meta.dirname,
    }, Buffer.from(`\
[*]
indent_size = 4

[!(package).json]
indent_size = 3`));

    matcher(path.join(import.meta.dirname, 'package.json')).should.include({indent_size: 4});
    matcher(path.join(import.meta.dirname, 'foo.json')).should.include({indent_size: 3});
  });
});

describe('unset', () => {
  it('pair witht the value `unset`', () => {
    const matcher = editorconfig.matcher({
      root: import.meta.dirname,
      unset: true,
    }, Buffer.from(`\
[*]
indent_size = 4

[*.json]
indent_size = unset
`));
    matcher(path.join(import.meta.dirname, 'index.js')).should.include({indent_size: 4});
    matcher(path.join(import.meta.dirname, 'index.json')).should.be.eql({ });
  });
});
