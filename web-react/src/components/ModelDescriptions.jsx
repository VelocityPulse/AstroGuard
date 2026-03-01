import styled from 'styled-components';

const Section = styled.section`
  background: #0c0c1a;
  border: 1px solid #1e1e3a;
  border-radius: 12px;
  padding: 20px 24px;
  max-width: 900px;
  margin: 12px auto;
`;

const Title = styled.h2`
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5c6bc0;
  margin-bottom: 16px;
`;

const Paragraph = styled.p`
  font-size: 0.8rem;
  color: #9e9e9e;
  line-height: 1.6;
  margin: 0 0 12px 0;
`;

const ModelName = styled.strong`
  color: #c9d1e0;
  font-weight: 700;
`;

const Hr = styled.hr`
  border: none;
  border-top: 1px solid #1a1a2e;
  margin: 12px 0;
`;

export default function ModelDescriptions() {
  return (
    <Section>
      <Title>Les mod{'\u00E8'}les m{'\u00E9'}t{'\u00E9'}orologiques</Title>

      <Paragraph>
        <ModelName>AROME {'\u2014'} M{'\u00E9'}t{'\u00E9'}o-France</ModelName>
        <br />
        AROME est le mod{'\u00E8'}le haute r{'\u00E9'}solution de M{'\u00E9'}t{'\u00E9'}o-France, sp{'\u00E9'}cialis{'\u00E9'} sur le territoire fran{'\u00E7'}ais. Avec des mailles de 1,5{'\u00A0'}km, il peut d{'\u00E9'}tecter des structures nuageuses {'\u00E0'} l{'\u2019'}{'\u00E9'}chelle d{'\u2019'}un quartier {'\u2014'} c{'\u2019'}est le zoom le plus pr{'\u00E9'}cis que l{'\u2019'}on puisse obtenir d{'\u2019'}un mod{'\u00E8'}le m{'\u00E9'}t{'\u00E9'}orologique op{'\u00E9'}rationnel. En contrepartie, il ne fournit que la couverture nuageuse totale (pas de d{'\u00E9'}composition par couche basse/moyenne/haute). Sa port{'\u00E9'}e est limit{'\u00E9'}e {'\u00E0'} 42{'\u00A0'}heures (environ J+2), mais il est recalcul{'\u00E9'} toutes les 3{'\u00A0'}heures avec des donn{'\u00E9'}es radar fra{'\u00EE'}ches. C{'\u2019'}est le mod{'\u00E8'}le id{'\u00E9'}al pour r{'\u00E9'}pondre {'\u00E0'} la question {'\u00AB'}{'\u00A0'}est-ce que je sors observer ce soir{'\u00A0'}?{'\u00A0'}{'\u00BB'}. Point de vigilance{'\u00A0'}: AROME a tendance {'\u00E0'} sous-estimer les nuages bas de type stratocumulus.
      </Paragraph>

      <Hr />

      <Paragraph>
        <ModelName>ICON-EU {'\u2014'} DWD (Service m{'\u00E9'}t{'\u00E9'}orologique allemand)</ModelName>
        <br />
        ICON-EU est le mod{'\u00E8'}le r{'\u00E9'}gional europ{'\u00E9'}en du DWD, le service m{'\u00E9'}t{'\u00E9'}orologique allemand. Ses mailles de 7{'\u00A0'}km offrent un bon compromis entre pr{'\u00E9'}cision et couverture g{'\u00E9'}ographique. Il fournit nativement la couverture nuageuse d{'\u00E9'}compos{'\u00E9'}e en trois couches (basse, moyenne, haute), ce qui est pr{'\u00E9'}cieux pour l{'\u2019'}astronomie{'\u00A0'}: un voile de cirrus en altitude n{'\u2019'}a pas le m{'\u00EA'}me impact qu{'\u2019'}une couche de stratus basse et opaque. Sa port{'\u00E9'}e va jusqu{'\u2019'}{'\u00E0'} 5{'\u00A0'}jours (J+5), avec une mise {'\u00E0'} jour toutes les 3{'\u00A0'}heures. La couverture nuageuse est une sortie directe du mod{'\u00E8'}le (pas d{'\u00E9'}riv{'\u00E9'}e de l{'\u2019'}humidit{'\u00E9'}), ce qui la rend fiable.
      </Paragraph>

      <Hr />

      <Paragraph>
        <ModelName>ECMWF IFS {'\u2014'} Centre europ{'\u00E9'}en de pr{'\u00E9'}vision m{'\u00E9'}t{'\u00E9'}orologique</ModelName>
        <br />
        L{'\u2019'}IFS du Centre europ{'\u00E9'}en (ECMWF) est largement consid{'\u00E9'}r{'\u00E9'} comme le meilleur mod{'\u00E8'}le m{'\u00E9'}t{'\u00E9'}orologique global. Il utilise des mailles de 9{'\u00A0'}km et dispose de 137{'\u00A0'}niveaux atmosph{'\u00E9'}riques verticaux, ce qui lui donne une repr{'\u00E9'}sentation tr{'\u00E8'}s fine de la structure nuageuse. Les couches basse, moyenne et haute sont disponibles nativement. Sa port{'\u00E9'}e atteint 10{'\u00A0'}jours (J+10), ce qui en fait le mod{'\u00E8'}le id{'\u00E9'}al pour planifier une sortie d{'\u2019'}observation en milieu de semaine prochaine. Attention{'\u00A0'}: au-del{'\u00E0'} de 90{'\u00A0'}heures (environ J+4), les donn{'\u00E9'}es passent d{'\u2019'}horaires {'\u00E0'} tri-horaires et sont r{'\u00E9'}-interpol{'\u00E9'}es {'\u00E0'} l{'\u2019'}heure par Open-Meteo {'\u2014'} une mention {'\u00AB'}{'\u00A0'}interpol{'\u00E9'}{'\u00A0'}{'\u00BB'} appara{'\u00EE'}t alors dans le tableau.
      </Paragraph>

      <Hr />

      <Paragraph>
        <ModelName>GFS {'\u2014'} NOAA (Service m{'\u00E9'}t{'\u00E9'}orologique am{'\u00E9'}ricain)</ModelName>
        <br />
        Le GFS est le mod{'\u00E8'}le global de la NOAA am{'\u00E9'}ricaine. Avec des mailles de 13{'\u00A0'}km, sa r{'\u00E9'}solution est plus grossi{'\u00E8'}re que les mod{'\u00E8'}les europ{'\u00E9'}ens, mais il offre la port{'\u00E9'}e la plus longue{'\u00A0'}: jusqu{'\u2019'}{'\u00E0'} 16{'\u00A0'}jours. Les couches nuageuses (basse, moyenne, haute) sont disponibles nativement. Au-del{'\u00E0'} de 120{'\u00A0'}heures (J+5), les donn{'\u00E9'}es deviennent tri-horaires. La fiabilit{'\u00E9'} des pr{'\u00E9'}visions se d{'\u00E9'}grade sensiblement apr{'\u00E8'}s J+10. Le GFS est surtout utile comme {'\u00AB'}{'\u00A0'}deuxi{'\u00E8'}me avis{'\u00A0'}{'\u00BB'} {'\u00E0'} comparer avec l{'\u2019'}ECMWF sur les {'\u00E9'}ch{'\u00E9'}ances lointaines{'\u00A0'}: si les deux mod{'\u00E8'}les convergent, la confiance augmente.
      </Paragraph>
    </Section>
  );
}
