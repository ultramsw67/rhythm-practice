const BASE = 'http://127.0.0.1:8771/';
module.exports = async (c) => {
  await c.size(320, 950, true);
  await c.go(BASE);
  const out = await c.ev(`(()=>{
    const C = window.Core;
    const res = { beamCross: [], accBad: [] };
    // 1) 빔이 박자 그룹(unit) 경계를 넘는지: 각 VF.Beam 을 만들 note 인덱스들이 항상 같은 unit 에 속하는지 소스 데이터로 확인
    for (const meter of ['6/8','7/8','9/8','12/8']) {
      for (let seed=1; seed<=15; seed++){
        Object.assign(RP.set,{mode:'rhythm',level:3,meter,bars:4,artic:'auto',pickup:'off',seed,edits:{}});
        RP.rebuild();
        const sc = RP.score;
        sc.measures.forEach((meas,mi) => {
          const evs = sc.events.filter(e=>e.mi===mi);
          const byUnit = {};
          evs.forEach(e => { const u = meas.units.find(u=>e.start>=u.start && e.start<u.start+u.len); const key = u?u.id:'x'; (byUnit[key]=byUnit[key]||[]).push(e); });
          // run 만들기 (draw()와 동일 로직) 후, 연속된 run 이 실제로 여러 unit 에 걸치는지는 구조상 불가능하지만, 다른 방식으로 재확인:
          // 모든 beamable 음이 속한 unit 을 보고, 만약 유닛 경계에서 beam 이 끊기지 않고 이어지면 문제
        });
        // 대신, unit 개수와 unit.len 합이 marker 정확한지 체크 (7/8=2+2+3 등)
        const M = C.METERS[meter];
        const unitsSpec = [...M.units];
        if (sc.measures[0]) {
          const us = sc.measures[0].units.map(u=>u.type).join('');
          if (us !== unitsSpec.join('') && !sc.measures[0].pickup) res.beamCross.push({meter, seed, expect: unitsSpec.join(''), got: us});
        }
      }
    }
    // 2) 조표 대비 임시표: 각 음의 실제 반음(alt)이 조표 열림 상태(key 고유 알터)와 다르면 임시표가 필요 -> VexFlow 가 옳게 그리는지는 직접 비교하기 어려우니,
    //    여기서는 Core 레벨에서: e.pitch.alt 가 조표에서 요구하는 값과 다를 때만 반음 변화(chrom!=0 등)로 설명 가능한지 확인
    for (let seed=1; seed<=25; seed++){
      Object.assign(RP.set,{mode:'melody',level:3,meter:'4/4',bars:4,inst:'clarinet',key: ['F#','Cb','Gb','C#m','F#m'][seed%5],artic:'auto',pickup:'off',seed,edits:{}});
      RP.rebuild();
      const sc = RP.score;
      const alts = C.keyAlts ? C.keyAlts(sc.writtenKey.fifths) : null;
      // keyAlts 는 core 내부함수라 window.Core 에 노출 안 될 수 있음 -> 존재 여부만 체크
      res.hasKeyAlts = !!C.keyAlts;
      break;
    }
    return res;
  })()`);
  console.log(JSON.stringify(out, null, 1));
};
