import styled from 'styled-components';

const Wrapper = styled.div`
  text-align: center;
  padding: 60px;
  color: ${({ $error }) => $error ? '#ef5350' : '#3949ab'};
`;

export default function Loader({ error }) {
  if (error) return <Wrapper $error>{'\u274C'} {error}</Wrapper>;
  return <Wrapper>{'\u23F3'} Chargement...</Wrapper>;
}
