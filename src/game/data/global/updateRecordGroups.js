export const groupUpdateRecordsByMonth = (records) => {
  const groupsByMonth = new Map();

  records.forEach((record) => {
    const monthKey = record.date.slice(0, 7);
    const existingGroup = groupsByMonth.get(monthKey);

    if (existingGroup) {
      existingGroup.records.push(record);
      return;
    }

    const [year, month] = monthKey.split('-').map(Number);
    groupsByMonth.set(monthKey, {
      key: monthKey,
      label: `${year}年${month}月`,
      records: [record]
    });
  });

  return [...groupsByMonth.values()].sort((left, right) => right.key.localeCompare(left.key));
};
