const cgContentWarningMap = {
  '荆锁会事件-game over': [
    {
      key: 'r18g',
      label: 'R-18-G',
      previewTitle: 'R18-G 警告',
      note: '四肢切断'
    }
  ]
};

export function resolveCgContentWarnings(regularName) {
  return cgContentWarningMap[regularName] ?? [];
}
