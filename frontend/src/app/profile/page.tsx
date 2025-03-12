'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect, useRef } from 'react';
import styles from './ProfilePage.module.css';
import { FaHome, FaEdit, FaUser, FaSignOutAlt, FaArrowLeft, FaCalendarAlt, FaLink, FaMapMarkerAlt, FaComment, FaRetweet, FaHeart, FaShareSquare } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Post {
  id: number;
  username: string;
  handle: string;
  avatar: string;
  content: string;
  time: string;
  comments: {
    commentCount: number;
    comments: string[];
  }
  reposts: number;
  postId: string | number;
  user: {
    username: string;
    id: string;
  }
  likes: {
    likeCount: number;
    likers: string[];
  }
}

interface UserProfile {
  username: string;
  pfp: string;
  bio: string;
  joinDate: string;
  postCount: number;
  pfpLink: string;
}

interface EditedProfile extends Partial<UserProfile> {
  pfpBase64?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<EditedProfile>({});
  const activeWallet = wallets[0];
  const postIdsRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderCollapsed(window.scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch user profile and posts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!activeWallet) return;
      
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const profileResponse = await fetch(`/api/profile/${activeWallet.address}`);
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }
        const profileData = await profileResponse.json();
        console.log(`Profile data: ${profileData}`);
        profileData.pfp = profileData.pfpLink;
        setUserProfile(profileData);
        
        // Fetch user posts
        const postsResponse = await fetch(`/api/profile/${activeWallet.address}/posts`);
        if (!postsResponse.ok) {
          throw new Error('Failed to fetch user posts');
        }
        const postsData = await postsResponse.json();
        
        const validPosts: Post[] = [];
        for (const post of postsData) {
          if (post.postId) {
            const postIdStr = post.postId.toString();
            if (!postIdsRef.current.has(postIdStr)) {
              validPosts.push({
                ...post,
                likes: {
                  likeCount: Number(post.likes?.likeCount) || 0,
                  likers: post.likes?.likers || []
                }
              });
              postIdsRef.current.add(postIdStr);
            }
          }
        }
        
        setUserPosts(validPosts);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [activeWallet]);

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedProfile({
      username: userProfile?.username || '',
      bio: userProfile?.bio || '',
      pfp: userProfile?.pfp || ''
    });
  };

  const handleProfilePictureClick = () => {
    if (isEditingProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview URL for the selected image
    const imageUrl = URL.createObjectURL(file);
    setEditedProfile({...editedProfile, pfp: imageUrl});

    // Convert the file to base64 for API submission
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setEditedProfile(prev => ({...prev, pfpBase64: base64String}));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!activeWallet) return;
    
    try {
      const response = await fetch(`/api/profile/${activeWallet.address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedProfile)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const data = await response.json();
      if (!data.transactionData) {
        throw new Error('Failed to like post');
      }

      const provider = await activeWallet.getEthereumProvider();
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: "0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95",
          data: data.transactionData,
          from: activeWallet.address,
          gasLimit: 250000
        }]
      })

      console.log('Transaction sent:', txHash);
      toast.success('Succesfully updated profile, waiting for confirmation...');

      const receipt = await provider.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })

      console.log('Transaction receipt:', receipt);
      toast.success('Transaction confirmed!');
      // refresh the profile
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          bio: editedProfile.bio || userProfile.bio,
          pfp: data.pfpLink || userProfile.pfp || ''
        };
        setUserProfile(updatedProfile);
      }
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!activeWallet) return;
    
    try {
      // Find the post in our state
      const postIndex = userPosts.findIndex(p => p.postId.toString() === postId);
      if (postIndex === -1) return;
      
      const post = userPosts[postIndex];
      const isLiked = post.likes.likers.includes(activeWallet.address);
      
      // Optimistically update UI
      const updatedPosts = [...userPosts];
      updatedPosts[postIndex] = {
        ...post,
        likes: {
          likeCount: isLiked ? post.likes.likeCount - 1 : post.likes.likeCount + 1,
          likers: isLiked 
            ? post.likes.likers.filter(addr => addr !== activeWallet.address)
            : [...post.likes.likers, activeWallet.address]
        }
      };
      setUserPosts(updatedPosts);
      
      // Send request to API
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: activeWallet.address })
      });
      
      let data = await response.json();
      console.log(data);

      
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Header */}
      <header className={`${styles.header} ${isHeaderCollapsed ? styles.headerCollapsed : styles.headerExpanded}`}>
        <div className={styles.headerContent}>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navItem}>
              <FaHome size={18} /> {!isHeaderCollapsed && "Home"}
            </Link>
            <Link href="/create" className={styles.navItem}>
              <FaEdit size={18} /> {!isHeaderCollapsed && "Post"}
            </Link>
            <Link href="/profile" className={`${styles.navItem} ${styles.active}`}>
              <FaUser size={18} /> {!isHeaderCollapsed && "Profile"}
            </Link>
            <button onClick={logout} className={styles.navItem}>
              <FaSignOutAlt size={18} /> {!isHeaderCollapsed && "Logout"}
            </button>
          </nav>
        </div>
      </header>

      <div className={styles.container}>
        <ToastContainer theme="dark" />
        
        <div className={styles.profileHeader}>
          <div className={styles.coverImage}>
            <img src="https://imgur.com/E4bgElt.png" alt="Cover" />
          </div>
          
          <div className={styles.profileInfo}>
            <div 
              className={`${styles.profileAvatar} ${isEditingProfile ? styles.profileAvatarEditable : ''}`}
              onClick={handleProfilePictureClick}
            >
              {isEditingProfile ? (
                <div className={styles.editableAvatar}>
                  <img src={editedProfile.pfp || userProfile?.pfp || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="Avatar" />
                  <div className={styles.avatarOverlay}>
                    <FaEdit />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <img src={userProfile?.pfp || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="Avatar" />
              )}
            </div>
            
            <div className={styles.profileActions}>
              {isEditingProfile ? (
                <>
                  <button onClick={() => setIsEditingProfile(false)} className={styles.cancelButton}>
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} className={styles.saveButton}>
                    Save
                  </button>
                </>
              ) : (
                <button onClick={handleEditProfile} className={styles.editButton}>
                  Edit profile
                </button>
              )}
            </div>
          </div>
          
          {isEditingProfile ? (
            <div className={styles.editForm}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  value={editedProfile.username || ''} 
                  onChange={(e) => setEditedProfile({...editedProfile, username: e.target.value})}
                  maxLength={50}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Bio</label>
                <textarea 
                  value={editedProfile.bio || ''} 
                  onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                  maxLength={160}
                />
              </div>
            </div>
          ) : (
            <div className={styles.profileDetails}>
              <h1 className={styles.profileName}>{userProfile?.username || 'Anonymous'}</h1>
              <p className={styles.profileBio}>{userProfile?.bio || 'No bio yet'}</p>
              
              <div className={styles.profileMeta}>
                <span className={styles.metaItem}>
                  <FaCalendarAlt /> Joined {userProfile?.joinDate || 'Recently'}
                </span>
              </div>
              
              <div className={styles.profileStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{userProfile?.postCount || 0}</span>
                  <span className={styles.statLabel}>Posts</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.profileTabs}>
          <button className={`${styles.tabButton} ${styles.active}`}>Posts</button>
          <button className={styles.tabButton}>Replies</button>
          <button className={styles.tabButton}>Media</button>
          <button className={styles.tabButton}>Likes</button>
        </div>
        
        <div className={styles.userPosts}>
          {userPosts.length === 0 ? (
            <div className={styles.noPosts}>
              <p>No posts yet</p>
              <Link href="/" className={styles.createPostLink}>Create your first post</Link>
            </div>
          ) : (
            userPosts.map(post => (
              <Link href={`/post/${post.postId}`} key={post.postId} className={styles.postLink}>
                <div className={styles.post}>
                  <div className={styles.postAvatar}>
                    <img src={post.avatar || userProfile?.pfpLink || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={`${post.user?.username}'s avatar`} />
                  </div>
                  <div className={styles.postContent}>
                    <div className={styles.postHeader}>
                      <span className={styles.postUsername}>{userProfile?.username}</span>
                      <span className={styles.postHandle}>{post.handle}</span>
                      <span className={styles.postTime}>· {post.time}</span>
                    </div>
                    <div className={styles.postText}>
                      {post.content}
                    </div>
                    <div className={styles.postActions}>
                      <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}><FaComment /> <span>{post.comments.commentCount}</span></button>
                      <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}><FaRetweet /> <span>{post.reposts}</span></button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLikePost(post.postId.toString());
                        }}
                        className={post.likes.likers.includes(activeWallet.address) ? styles.likedButton : ''}
                      >
                        <FaHeart /> <span>{post.likes.likeCount}</span>
                      </button>
                      <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}><FaShareSquare /></button>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
} 