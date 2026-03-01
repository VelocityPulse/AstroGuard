import styled from 'styled-components';

const Section = styled.section`
  background: #0c0c1a;
  border: 1px solid #1e1e3a;
  border-radius: 12px;
  padding: 20px 24px;
  margin: 12px 16px;
`;

const Title = styled.h2`
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5c6bc0;
  margin-bottom: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
`;

const Card = styled.div`
  background: #111125;
  border: 1px solid #1a1a30;
  border-radius: 8px;
  padding: 12px 14px;
`;

const CardTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: #c9d1e0;
  margin-bottom: 4px;
`;

const CardMeta = styled.div`
  font-size: 0.65rem;
  color: #5c6bc0;
  margin-bottom: 8px;
`;

const CardText = styled.p`
  font-size: 0.72rem;
  color: #9e9e9e;
  line-height: 1.5;
  margin: 0;
`;

export default function ModelDescriptions() {
  return (
    <Section>
      <Title>Les mod{'\u00E8'}les m{'\u00E9'}t{'\u00E9'}orologiques</Title>
      <Grid>
        <Card>
          <CardTitle>AROME</CardTitle>
          <CardMeta>M{'\u00E9'}t{'\u00E9'}o-France {'\u00B7'} 1,5{'\u00A0'}km {'\u00B7'} J{'\u2192'}J+2 {'\u00B7'} m{'\u00E0'}j 3h</CardMeta>
          <CardText>
            Mod{'\u00E8'}le haute r{'\u00E9'}solution de M{'\u00E9'}t{'\u00E9'}o-France (mailles de 1,5{'\u00A0'}km),
            le zoom le plus pr{'\u00E9'}cis disponible sur la France. Id{'\u00E9'}al pour
            r{'\u00E9'}pondre {'\u00E0'} {'\u00AB'}{'\u00A0'}est-ce que je sors observer ce soir{'\u00A0'}?{'\u00A0'}{'\u00BB'}.
            Recalcul{'\u00E9'} toutes les 3{'\u00A0'}heures avec des donn{'\u00E9'}es radar fra{'\u00EE'}ches.
            Seul le total nuageux est fourni (pas de couches). Tend {'\u00E0'}
            sous-estimer les stratus bas.
          </CardText>
        </Card>

        <Card>
          <CardTitle>ICON-EU</CardTitle>
          <CardMeta>DWD {'\u00B7'} 7{'\u00A0'}km {'\u00B7'} J{'\u2192'}J+5 {'\u00B7'} m{'\u00E0'}j 3h</CardMeta>
          <CardText>
            Mod{'\u00E8'}le r{'\u00E9'}gional europ{'\u00E9'}en du DWD allemand (mailles de 7{'\u00A0'}km),
            bon compromis pr{'\u00E9'}cision/port{'\u00E9'}e. Fournit nativement la couverture
            d{'\u00E9'}compos{'\u00E9'}e en trois couches (basse, moyenne, haute){'\u00A0'}: un voile
            de cirrus en altitude n{'\u2019'}a pas le m{'\u00EA'}me impact qu{'\u2019'}un stratus
            bas et opaque. Sortie directe du mod{'\u00E8'}le, ce qui la rend fiable.
          </CardText>
        </Card>

        <Card>
          <CardTitle>ECMWF IFS</CardTitle>
          <CardMeta>Centre europ{'\u00E9'}en {'\u00B7'} 9{'\u00A0'}km {'\u00B7'} J{'\u2192'}J+10 {'\u00B7'} m{'\u00E0'}j 6h</CardMeta>
          <CardText>
            Consid{'\u00E9'}r{'\u00E9'} comme le meilleur mod{'\u00E8'}le global (137{'\u00A0'}niveaux
            verticaux). Couches basse, moyenne et haute natives. Port{'\u00E9'}e
            de 10{'\u00A0'}jours, id{'\u00E9'}al pour planifier une sortie en milieu de
            semaine prochaine. Au-del{'\u00E0'} de ~J+4 les donn{'\u00E9'}es passent en
            tri-horaire et sont interpol{'\u00E9'}es ({'\u26A0'} signal{'\u00E9'} dans le tableau).
          </CardText>
        </Card>

        <Card>
          <CardTitle>GFS</CardTitle>
          <CardMeta>NOAA {'\u00B7'} 13{'\u00A0'}km {'\u00B7'} J{'\u2192'}J+16 {'\u00B7'} m{'\u00E0'}j 6h</CardMeta>
          <CardText>
            Mod{'\u00E8'}le global de la NOAA am{'\u00E9'}ricaine, r{'\u00E9'}solution plus grossi{'\u00E8'}re
            (13{'\u00A0'}km) mais port{'\u00E9'}e la plus longue{'\u00A0'}: 16{'\u00A0'}jours. Couches
            nuageuses natives. Fiabilit{'\u00E9'} en baisse apr{'\u00E8'}s J+10. Utile comme
            {'\u00AB'}{'\u00A0'}second avis{'\u00A0'}{'\u00BB'} face {'\u00E0'} l{'\u2019'}ECMWF{'\u00A0'}: quand les deux
            convergent, la confiance augmente.
          </CardText>
        </Card>

        <Card>
          <CardTitle>Total (synth{'\u00E8'}se)</CardTitle>
          <CardMeta>Moyenne pond{'\u00E9'}r{'\u00E9'}e par pertinence</CardMeta>
          <CardText>
            Moyenne pond{'\u00E9'}r{'\u00E9'}e de tous les mod{'\u00E8'}les, chacun coefficient{'\u00E9'}
            selon sa pertinence {'\u00E0'} l{'\u2019'}horizon donn{'\u00E9'}. AROME domine {'\u00E0'}
            court terme, ECMWF {'\u00E0'} moyen terme, GFS au-del{'\u00E0'}.
            Alimente l{'\u2019'}indicateur {'\u2713'} du tableau. Lecture{'\u00A0'}:
            {'\u2264'}20{'\u00A0'}% = ciel d{'\u00E9'}gag{'\u00E9'} {'\u2705'},
            20{'\u2013'}50{'\u00A0'}% = partiel {'\u25B2'},
            {'>'}50{'\u00A0'}% = couvert {'\uD83D\uDD34'}.
          </CardText>
        </Card>
      </Grid>
    </Section>
  );
}
