export type GameMapBreadcrumb = ReadonlyArray<string>;

export const mapBreadcrumbs = {
  city_desire: ['慕妮卡帝国', '醉欲之城'],
  city_jingjiang_school: ['平行世界冒险', '浮光掠影', '荆江市', '荆南大学'],
  liluo_estate: ['慕妮卡帝国', '缚神领地', '四季花园'],
  liluo_house_living_room: ['慕妮卡帝国', '缚神领地', '四季花园', '小别野'],
  liluo_room: ['慕妮卡帝国', '缚神领地', '四季花园', '小别野', '璃落的房间'],
  mumu_room: ['慕妮卡帝国', '缚神领地', '四季花园', '小别野', '沐沐的牢房']
} as const satisfies Record<string, GameMapBreadcrumb>;

export function getMapBreadcrumb(mapId: string): GameMapBreadcrumb | undefined {
  return mapBreadcrumbs[mapId as keyof typeof mapBreadcrumbs];
}
