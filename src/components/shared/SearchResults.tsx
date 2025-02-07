import { Loader } from 'lucide-react';
import GridPostList from './GridPostList';


type searchResultsProps = {
  isSearchFetching: boolean;
  searchedPosts: any;
}

const SearchResults = ({ isSearchFetching, searchedPosts }: searchResultsProps) => {

  if(isSearchFetching) {
    return <Loader />
  }

  if(searchedPosts && searchedPosts.documents.length > 0) {
  return (
   <GridPostList posts={searchedPosts.documents} />
  )
}

  return (
    <p className='text-light-4 mt-10 text-center w-full'>No Results Found</p>
  )
}

export default SearchResults