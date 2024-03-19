import Heading from '@/components/heading';
import Project from '@/components/project';
import { Grid, Tooltip, useTheme } from '@geist-ui/react';
import ReactMarkdown from 'react-markdown';
import ReactTimeAgo from 'react-time-ago';
import gfm from 'remark-gfm';
import useSWR from 'swr';
import { fetchWithToken } from '../lib/helpers';
import { usePrefers } from '../lib/use-prefers';
import TGFile from './../components/views/File';
import Update from './../components/views/Update';
import HomePage from './home';

const TooltipContainer = ({ verboseDate, children }) => (
  <Tooltip text={verboseDate}>{children}</Tooltip>
);

export const Pager = ({ initialData: data }) => {
  const formattedData = (data || [])
    .filter((u) => {
      return u.message || u.file_id || u.locked;
    })
    .map((u) => {
      return {
        ...u,
        createdAt: (
          <ReactTimeAgo
            wrapperComponent={TooltipContainer}
            tooltip={false}
            date={u.createdAt}
            locale="en-US"
          />
        ),
        message: (() => {
          if (!u.message) return;

          if (!u?.entities) {
            return <span style={{ whiteSpace: 'pre-wrap' }}>{u.message}</span>;
          }

          return (
            <ReactMarkdown remarkPlugins={[gfm]}>{u.message}</ReactMarkdown>
          );
        })(),
        file_id: (() => {
          if (!u.file_id) return;
          if (!u.groupId) {
            return <TGFile u={u} />;
          }

          if (u.groupId) {
            const groupMedia = u.archive.filter((b) => b.groupId === u.groupId);
            if (groupMedia?.length) {
              return (
                <Grid.Container gap={1} justify="center">
                  <Grid key={u.createdAt} md={6} xs={12}>
                    <TGFile u={u} />
                  </Grid>
                  {groupMedia.map((b) => (
                    <Grid key={b.createdAt} md={6} xs={24} sm={12}>
                      <TGFile u={b} />
                    </Grid>
                  ))}
                </Grid.Container>
              );
            }
          }
        })(),
      };
    });

  return formattedData.map((user) => <Project key={user.id} {...user} />);
};

export default function Home() {
  const prefers = usePrefers();
  const theme = useTheme();

  const { data: initialData, error: initialDataError } = useSWR(
    [`/api/updates`],
    fetchWithToken,
  );

  const { data: groups, error: groupsError } = useSWR(
    [`/api/groups`],
    fetchWithToken,
  );

  if (!prefers?.userInfo) {
    return <HomePage />;
  }

  return (
    <>
      <Heading
        user={{
          ...prefers.userInfo,
          role: 'User',
          groups: Array.isArray(groups) ? groups.join(', ') : null,
        }}
      />

      <Update initialDataError={initialDataError} initialData={initialData} />
    </>
  );
}
