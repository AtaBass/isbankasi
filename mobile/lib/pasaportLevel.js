// Finansal Pasaport seviyeleri – profil ve görevler ekranında tek kaynak
export const PASAPORT_LEVELS = [
  { level: 1, title: 'Başlangıç', desc: 'Gelir Bölücü aktif + ilk hedef cebi', done: true },
  { level: 2, title: 'Düzenli', desc: '4 hafta mikro birikim sürdürüldü', done: true },
  { level: 3, title: 'İleri', desc: 'Nays üyesi + 30 gün birikime dokunmama', done: false },
  { level: 4, title: 'Uzman', desc: 'Hedef cebini tamamla', done: false },
];

/** Profil / görevlerde gösterilecek güncel seviye (son tamamlanan). */
export function getCurrentPasaportLevel() {
  const done = PASAPORT_LEVELS.filter((p) => p.done);
  const current = done.length > 0 ? done[done.length - 1] : PASAPORT_LEVELS[0];
  return { level: current.level, title: current.title };
}
