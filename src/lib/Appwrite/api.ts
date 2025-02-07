import { ID } from 'Appwrite';
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from '@/types';
import { account, appwritConfig, avatars, databases, storage } from './config';
import { Query } from 'Appwrite';
import { ImageGravity  } from 'Appwrite'



export async function createUserAccount(user: INewUser) {
    try{
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        );

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(user.name);

      const newUser = await saveUserToDB({
        accountId: newAccount.$id,
        name: newAccount.name,
        email: newAccount.email,
        username: user.username,
        imageUrl: avatarUrl,
      })

        return newUser;
    }
    catch(error){
        console.log(error);
        return error;
    }
}


export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    imageUrl: string;
    username?: string;
}
) {
    try {
        const newUser = await databases.createDocument(
            appwritConfig.databaseId,
            appwritConfig.userCollectionId,
            ID.unique(),
            user,
        )

        return newUser;
    }
    catch (error) {
        console.log(error);
    }
}


export async function SignInAccount(user: { email: string; password: string }) {
    try {
        const session = await account.createEmailPasswordSession(user.email, user.password);
        console.log("Session created successfully:", session);
        return session;
    } catch (error) {
        console.error("Login error:", error);
    }
}

export async function getCurrentUser (){
    try{
        const cuurentAccount = await account.get();


        if(!cuurentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwritConfig.databaseId,
            appwritConfig.userCollectionId,
            [Query.equal('accountId', cuurentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0]
    }
    catch(error){
        console.log(error)
    }
}

export async function signOutAccount(){
    try{
        const session = await account.deleteSession("current")

        return session;
    }
    catch(error){
        console.log(error);
    }
     
}

export async function createPost(post: INewPost) {
    try{
        const uploadedFile = await uploadFile(post.file[0]);

        if(!uploadedFile) throw Error;

        const fileUrl = getFilePreview(uploadedFile.$id)

        if(!fileUrl) {
            deleteFile(uploadedFile.$id)
            throw Error; 
        }

        const tags = post.tags?.replace(/ /g,'').split(',') || [];

        const newPost = await databases.createDocument(
            appwritConfig.databaseId,
            appwritConfig.postCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags
            }
        )

        if(!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error;
        }
        return newPost;
    }
    catch(error){
        console.log(error);
    }
}

export async function uploadFile(file: File){
    try{
        const uploadedFile = await storage.createFile(
            appwritConfig.storageId,
            ID.unique(),
            file
        );

        return uploadedFile;
    }

    catch(error){
        console.log(error);
    }
}


export function getFilePreview(fileId: string) {
    try {
      const fileUrl = storage.getFilePreview(
        appwritConfig.storageId,
        fileId,
        2000,
        2000,
        ImageGravity.Top,
        100
      );
  
      if (!fileUrl) throw Error;
  
      return fileUrl;
    } catch (error) {
      console.log(error);
    }
  }


export async function deleteFile(fileId: string){
    try{
        await storage.deleteFile(appwritConfig.storageId, fileId);
        return { status: 'ok' }
    }
    catch(error){
        console.log(error)
    }
}

export async function getRecentPosts() {
    const posts = await databases.listDocuments(
        appwritConfig.databaseId,
        appwritConfig.postCollectionId,
        [Query.orderDesc('$createdAt'), Query.limit(20)]
    )

    if(!posts) throw Error;

    return posts
}

export async function likePost(postId: string, likesArray: string[]) {
    try{
        const updatedPost = await databases.updateDocument(
            appwritConfig.databaseId,
            appwritConfig.postCollectionId,
            postId,
            {
                likes: likesArray
            }
        )

        if(!updatedPost) throw Error;

        return updatedPost;
    }
    catch(error){
        console.log(error)
    }
}

export async function savePost(userId: string, postId: string) {
    try {
        if (!userId || !postId) {
            throw new Error("userId and postId are required");
        }

        console.log("User ID:", userId);  // Should be a string
        console.log("Post ID:", postId);  // Should be a string

        // Create the document with only raw IDs
        const updatedPost = await databases.createDocument(
            appwritConfig.databaseId,
            appwritConfig.savesCollectionId,
            ID.unique(),
            {
                user: userId.toString(),  // Ensure only the ID is stored
                post: postId.toString(),  // Ensure only the ID is stored
            }
        );


        console.log("Saved Post:", updatedPost);
        return updatedPost;
    } catch (error) {
        console.error("Error saving post:", error);
        throw error;
    }
}

export async function deleteSavedPost(savedRecordId: string) {
    try{
        const statusCode = await databases.deleteDocument(
            appwritConfig.databaseId,
            appwritConfig.savesCollectionId,
            savedRecordId,
        )

        if(!statusCode) throw Error;

        return { status: 'ok' };
    }
    catch(error){
        console.log(error)
    }
}

export async function getPostById(postId: string) {
    try{
        const post = await databases.getDocument(
            appwritConfig.databaseId,
            appwritConfig.postCollectionId,
            postId
        )

        return post;
    }       
    catch(error){
        console.log(error)
    }
}

export async function updatePost(post: IUpdatePost) {

    const hasFileToUpdate = post.file.length > 0;
    try{

        let image = {
            imageUrl: post.imageUrl,
            imageId:  post.imageId,
        }

        if(hasFileToUpdate){
        const uploadedFile = await uploadFile(post.file[0]);

        if(!uploadedFile) throw Error;

        const fileUrl = getFilePreview(uploadedFile.$id)

        if(!fileUrl) {
            deleteFile(uploadedFile.$id)
            throw Error; 
        }

        image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
        }

        

        

        const tags = post.tags?.replace(/ /g,'').split(',') || [];

        const updatedPost = await databases.updateDocument(
            appwritConfig.databaseId,
            appwritConfig.postCollectionId,
            post.postId,
            {
               
                caption: post.caption,
                imageUrl: image.imageUrl,
                imageId: image.imageId,
                location: post.location,
                tags: tags
            }
        )

        if(!updatedPost) {
            await deleteFile(post.imageId)
            throw Error;
        }
        return updatedPost;
    }
    catch(error){
        console.log(error);
    }
}

export async function deletePost(postId: string, imageId: string) {
    if(!postId || !imageId) throw Error;

    try{
        await databases.deleteDocument(
            appwritConfig.databaseId,
            appwritConfig.postCollectionId,
            postId
        )

        return { status: 'ok' }
    }
    catch(error){
        console.log(error)
    }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
    const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(10)]
    
    if(pageParam){
        queries.push(Query.cursorAfter(pageParam.toString()))
    }

    try{
        const posts = await databases.listDocuments(
            appwritConfig.databaseId,
            appwritConfig.postCollectionId,
            queries
        )

        if(!posts) throw Error;

        return posts;
    }
    catch(error){
        console.log(error);
    }
}

export async function searchPost(searchTerm: string) {
    try{
        const posts = await databases.listDocuments(
            appwritConfig.databaseId,
            appwritConfig.postCollectionId,
            [Query.search('caption', searchTerm)]
        )

        if(!posts) throw Error;

        return posts;
    }
    catch(error){
        console.log(error);
    }
}

export async function getUserById(userId: string) {
    try {
      const user = await databases.getDocument(
        appwritConfig.databaseId,
        appwritConfig.userCollectionId,
        userId
      );
  
      if (!user) throw Error;
  
      return user;
    } catch (error) {
      console.log(error);
    }
}

export async function updateUser(user: IUpdateUser) {
    const hasFileToUpdate = user.file.length > 0;
    try {
      let image = {
        imageUrl: user.imageUrl,
        imageId: user.imageId,
      };
  
      if (hasFileToUpdate) {
        // Upload new file to appwrite storage
        const uploadedFile = await uploadFile(user.file[0]);
        if (!uploadedFile) throw Error;
  
        // Get new file url
        const fileUrl = getFilePreview(uploadedFile.$id);
        if (!fileUrl) {
          await deleteFile(uploadedFile.$id);
          throw Error;
        }
  
        image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
      }
  
      //  Update user
      const updatedUser = await databases.updateDocument(
        appwritConfig.databaseId,
        appwritConfig.userCollectionId,
        user.userId,
        {
          name: user.name,
          bio: user.bio,
          imageUrl: image.imageUrl,
          imageId: image.imageId,
        }
      );
  
      // Failed to update
      if (!updatedUser) {
        // Delete new file that has been recently uploaded
        if (hasFileToUpdate) {
          await deleteFile(image.imageId);
        }
        // If no new file uploaded, just throw error
        throw Error;
      }
  
      // Safely delete old file after successful update
      if (user.imageId && hasFileToUpdate) {
        await deleteFile(user.imageId);
      }
  
      return updatedUser;
    } catch (error) {
      console.log(error);
    }
}

export async function getUsers(limit?: number) {
    const queries: any[] = [Query.orderDesc("$createdAt")];
  
    if (limit) {
      queries.push(Query.limit(limit));
    }
  
    try {
      const users = await databases.listDocuments(
        appwritConfig.databaseId,
        appwritConfig.userCollectionId,
        queries
      );
  
      if (!users) throw Error;
  
      return users;
    } catch (error) {
      console.log(error);
    }
  }