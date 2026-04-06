import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import TaskIcon from '@mui/icons-material/Task';
import MessageIcon from '@mui/icons-material/Message';
import useAuth from '../../hooks/useAuth';

const stats = [
  { title: 'Utilisateurs', value: '—', icon: <PeopleIcon sx={{ fontSize: 40 }} />, color: '#1B4B8A' },
  { title: 'Projets', value: '—', icon: <FolderIcon sx={{ fontSize: 40 }} />, color: '#7AB929' },
  { title: 'Tâches', value: '—', icon: <TaskIcon sx={{ fontSize: 40 }} />, color: '#FF8C00' },
  { title: 'Messages', value: '—', icon: <MessageIcon sx={{ fontSize: 40 }} />, color: '#00897B' },
];

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>
        Tableau de bord
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Bienvenue, <strong>{user?.prenom} {user?.nom}</strong> 👋
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: `${stat.color}22`,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
